/**
 * Shared payout helpers (chain explorers + Solana RPC blockhash).
 * Wallet connect / send runs through RainbowKit (EVM) and Solana wallet-adapter.
 */
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import type { Adapter } from '@solana/wallet-adapter-base'
import type { ClaimChain } from '@/services/referralPayments'
import { ROBINHOOD_EXPLORER } from '@/lib/chains'

export { ROBINHOOD_CHAIN_ID, ROBINHOOD_EXPLORER } from '@/lib/chains'

const SOLANA_RPC_CANDIDATES = [
  import.meta.env.VITE_SOLANA_RPC_URL as string | undefined,
  'https://solana-rpc.publicnode.com',
  'https://rpc.ankr.com/solana',
  'https://api.mainnet-beta.solana.com',
].filter((u): u is string => typeof u === 'string' && u.trim().length > 0)

export async function getSolanaBlockhash(rpcUrl?: string) {
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
    `Failed to get Solana blockhash from all RPCs. Set VITE_SOLANA_RPC_URL. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  )
}

export async function sendSolWithAdapter(params: {
  adapter: Adapter
  to: string
  amountLamports: number
  connection: Connection
}): Promise<string> {
  if (!params.adapter.publicKey) {
    throw new Error('Solana wallet not connected')
  }
  if (!params.adapter.sendTransaction) {
    throw new Error('Connected wallet cannot send transactions')
  }

  const from = params.adapter.publicKey
  const to = new PublicKey(params.to)
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports: params.amountLamports,
    }),
  )

  const { blockhash, lastValidBlockHeight } = await getSolanaBlockhash()
  tx.recentBlockhash = blockhash
  tx.feePayer = from

  const signature = await params.adapter.sendTransaction(tx, params.connection)

  try {
    await params.connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      'confirmed',
    )
  } catch {
    // Backend /confirm is the source of truth
  }

  return signature
}

export function weiToHex(amountWei: string): `0x${string}` {
  if (amountWei.startsWith('0x')) return amountWei as `0x${string}`
  return `0x${BigInt(amountWei).toString(16)}`
}

export function explorerTxUrl(chain: ClaimChain, hash: string) {
  return chain === 'robinhood'
    ? `${ROBINHOOD_EXPLORER}/tx/${hash}`
    : `https://solscan.io/tx/${hash}`
}
