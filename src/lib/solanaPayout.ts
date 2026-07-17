/**
 * Browser wallet helpers for manual referral payouts.
 * - Solana → Phantom (window.solana)
 * - Robinhood Chain → MetaMask / EIP-1193 (window.ethereum)
 *
 * Note: Solana's public RPC (api.mainnet-beta.solana.com) often returns 403
 * from browsers. Prefer VITE_SOLANA_RPC_URL (Helius / QuickNode / etc.).
 */
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import type { ClaimChain } from '@/services/referralPayments'

/** Robinhood Chain mainnet */
export const ROBINHOOD_CHAIN_ID = 4663
export const ROBINHOOD_CHAIN_ID_HEX = '0x1237'
export const ROBINHOOD_RPC = 'https://rpc.mainnet.chain.robinhood.com/'
export const ROBINHOOD_EXPLORER = 'https://robinhoodchain.blockscout.com'

/** Browser-friendly Solana RPC fallbacks (public mainnet often 403s). */
const SOLANA_RPC_CANDIDATES = [
  import.meta.env.VITE_SOLANA_RPC_URL as string | undefined,
  'https://solana-rpc.publicnode.com',
  'https://rpc.ankr.com/solana',
  'https://api.mainnet-beta.solana.com',
].filter((u): u is string => typeof u === 'string' && u.trim().length > 0)

async function getSolanaBlockhash(rpcUrl?: string) {
  const urls = rpcUrl
    ? [rpcUrl, ...SOLANA_RPC_CANDIDATES.filter((u) => u !== rpcUrl)]
    : SOLANA_RPC_CANDIDATES

  let lastError: unknown
  for (const url of urls) {
    try {
      const connection = new Connection(url, 'confirmed')
      const latest = await connection.getLatestBlockhash('confirmed')
      return { connection, ...latest, rpcUrl: url }
    } catch (err) {
      lastError = err
    }
  }
  throw new Error(
    `Failed to get Solana blockhash from all RPCs. Set VITE_SOLANA_RPC_URL to a Helius/QuickNode endpoint. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  )
}

type PhantomProvider = {
  isPhantom?: boolean
  publicKey?: { toString(): string }
  connect: () => Promise<{ publicKey: { toString(): string } }>
  signAndSendTransaction: (tx: Transaction) => Promise<{ signature: string }>
}

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  isMetaMask?: boolean
}

function getPhantom(): PhantomProvider | null {
  const w = window as unknown as {
    solana?: PhantomProvider
    phantom?: { solana?: PhantomProvider }
  }
  const provider = w.solana?.isPhantom ? w.solana : w.phantom?.solana
  return provider ?? null
}

function getEthereum(): EthereumProvider | null {
  const w = window as unknown as { ethereum?: EthereumProvider }
  return w.ethereum ?? null
}

export function hasPhantomWallet() {
  return !!getPhantom()
}

export function hasEthereumWallet() {
  return !!getEthereum()
}

export function hasWalletForChain(chain: ClaimChain) {
  return chain === 'robinhood' ? hasEthereumWallet() : hasPhantomWallet()
}

export function walletLabelForChain(chain: ClaimChain) {
  if (chain === 'robinhood') {
    return hasEthereumWallet() ? 'Pay with MetaMask (Robinhood Chain)' : null
  }
  return hasPhantomWallet() ? 'Pay with Phantom (Solana)' : null
}

export async function sendSolWithPhantom(params: {
  to: string
  amountLamports: number
  rpcUrl?: string
}): Promise<string> {
  const provider = getPhantom()
  if (!provider) {
    throw new Error(
      'Phantom wallet not found. Install Phantom or paste a Solana tx signature after sending SOL.',
    )
  }

  await provider.connect()
  if (!provider.publicKey) throw new Error('Phantom did not return a public key')

  const from = new PublicKey(provider.publicKey.toString())
  const to = new PublicKey(params.to)

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports: params.amountLamports,
    }),
  )

  const { connection, blockhash, lastValidBlockHeight } = await getSolanaBlockhash(
    params.rpcUrl,
  )
  tx.recentBlockhash = blockhash
  tx.feePayer = from

  const { signature } = await provider.signAndSendTransaction(tx)

  // Soft confirm — backend /confirm verifies the tx on-chain. Don't fail the
  // payout UX if our RPC rate-limits confirmation.
  try {
    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      'confirmed',
    )
  } catch {
    // ignore — claim confirm endpoint is the source of truth
  }

  return signature
}

async function ensureRobinhoodChain(provider: EthereumProvider) {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ROBINHOOD_CHAIN_ID_HEX }],
    })
  } catch (err) {
    const code = (err as { code?: number })?.code
    // 4902 = chain not added
    if (code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: ROBINHOOD_CHAIN_ID_HEX,
            chainName: 'Robinhood Chain',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: [ROBINHOOD_RPC],
            blockExplorerUrls: [ROBINHOOD_EXPLORER],
          },
        ],
      })
      return
    }
    throw err
  }
}

export async function sendEthOnRobinhood(params: {
  to: string
  amountWei: string
}): Promise<string> {
  const provider = getEthereum()
  if (!provider) {
    throw new Error(
      'No Ethereum wallet found. Install MetaMask (or another EIP-1193 wallet) or paste a tx hash after sending ETH on Robinhood Chain.',
    )
  }

  const accounts = (await provider.request({
    method: 'eth_requestAccounts',
  })) as string[]
  const from = accounts[0]
  if (!from) throw new Error('No account returned from wallet')

  await ensureRobinhoodChain(provider)

  const valueHex =
    params.amountWei.startsWith('0x')
      ? params.amountWei
      : `0x${BigInt(params.amountWei).toString(16)}`

  const txHash = (await provider.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from,
        to: params.to,
        value: valueHex,
      },
    ],
  })) as string

  if (!txHash) throw new Error('Wallet did not return a transaction hash')
  return txHash
}

/** Route to the right browser wallet for the claim chain, then return tx hash. */
export async function sendPayoutWithWallet(params: {
  chain: ClaimChain
  to: string
  amountLamports?: number | null
  amountWei?: string | null
}): Promise<string> {
  if (params.chain === 'robinhood') {
    if (!params.amountWei) throw new Error('Missing amountWei for Robinhood payout')
    return sendEthOnRobinhood({ to: params.to, amountWei: params.amountWei })
  }
  if (params.amountLamports == null) throw new Error('Missing amountLamports for Solana payout')
  return sendSolWithPhantom({ to: params.to, amountLamports: params.amountLamports })
}
