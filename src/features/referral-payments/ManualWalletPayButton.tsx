import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAccount, useSendTransaction, useSwitchChain } from 'wagmi'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Button } from '@/components/ui/Button'
import { ROBINHOOD_CHAIN_ID, sendSolWithAdapter } from '@/lib/solanaPayout'
import type { PreparePayoutResult } from '@/services/referralPayments'

type Phase = 'idle' | 'paying' | 'confirming' | 'done' | 'error'

export function ManualWalletPayButton({
  prep,
  phase,
  onPhase,
  onTxHash,
  onConfirm,
  onError,
}: {
  prep: PreparePayoutResult
  phase: Phase
  onPhase: (p: Phase) => void
  onTxHash: (hash: string) => void
  onConfirm: (hash: string) => Promise<void>
  onError: (message: string) => void
}) {
  const isRh = prep.chain === 'robinhood'
  const { openConnectModal } = useConnectModal()
  const { address, isConnected, chainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { sendTransactionAsync } = useSendTransaction()

  const { setVisible: openSolanaModal } = useWalletModal()
  const { connection } = useConnection()
  const { publicKey, connected: solConnected, wallet, connecting } = useWallet()

  const [localBusy, setLocalBusy] = useState(false)
  const busy = localBusy || phase === 'paying' || phase === 'confirming'

  const walletReady = isRh ? isConnected : solConnected

  async function pay() {
    onError('')
    try {
      if (isRh) {
        if (!isConnected) {
          openConnectModal?.()
          return
        }
        if (!prep.amountWei) throw new Error('Missing amountWei')
        if (!address) throw new Error('No wallet address')

        setLocalBusy(true)
        onPhase('paying')

        if (chainId !== ROBINHOOD_CHAIN_ID) {
          await switchChainAsync({ chainId: ROBINHOOD_CHAIN_ID })
        }

        const hash = await sendTransactionAsync({
          to: prep.recipientAddress as `0x${string}`,
          value: BigInt(
            prep.amountWei.startsWith('0x')
              ? prep.amountWei
              : prep.amountWei,
          ),
          chainId: ROBINHOOD_CHAIN_ID,
        })
        onTxHash(hash)
        onPhase('confirming')
        await onConfirm(hash)
      } else {
        if (!solConnected || !wallet?.adapter || !publicKey) {
          openSolanaModal(true)
          return
        }
        if (prep.amountLamports == null) throw new Error('Missing amountLamports')

        setLocalBusy(true)
        onPhase('paying')

        const signature = await sendSolWithAdapter({
          adapter: wallet.adapter,
          to: prep.recipientAddress,
          amountLamports: prep.amountLamports,
          connection,
        })
        onTxHash(signature)
        onPhase('confirming')
        await onConfirm(signature)
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'shortMessage' in err
            ? String((err as { shortMessage: string }).shortMessage)
            : 'Payment failed'
      // User closed modal / rejected — don't treat as hard error noise
      if (/reject|denied|cancel/i.test(msg)) {
        onPhase('idle')
        onError(msg)
      } else {
        onPhase('error')
        onError(msg)
      }
    } finally {
      setLocalBusy(false)
    }
  }

  if (phase === 'done') {
    return (
      <Button className="w-full bg-emerald-600 hover:bg-emerald-600 pointer-events-none" disabled>
        <CheckCircle2 className="h-4 w-4" />
        Successful
      </Button>
    )
  }

  const label = (() => {
    if (phase === 'confirming') return 'Confirming payout…'
    if (phase === 'paying' || localBusy) return 'Paying…'
    if (connecting) return 'Connecting…'
    if (!walletReady) return 'Connect wallet'
    return isRh
      ? `Pay ${prep.amountSol} ETH`
      : `Pay ${prep.amountSol} SOL`
  })()

  return (
    <Button className="w-full" disabled={busy || connecting} onClick={() => void pay()}>
      {(busy || connecting) && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
      {label}
    </Button>
  )
}
