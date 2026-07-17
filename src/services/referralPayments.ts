import axios from 'axios'
import { useMockData } from '@/config/env'
import { referralPayments as mockPayments } from '@/data/mock'
import { api, assertLiveApi } from '@/lib/api'

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ClaimStatus = 'pending' | 'paid' | 'rejected' | 'approved' | 'failed' | string
export type ClaimChain = 'solana' | 'robinhood'
export type ClaimCurrency = 'SOL' | 'ETH'

export interface ChainPoolInfo {
  chain: ClaimChain
  currency: ClaimCurrency
  poolWallet: string | null
  hasPoolPrivateKey: boolean
}

export interface PayoutMode {
  mode: 'manual' | 'auto'
  autoPayoutEnabled: boolean
  minClaimSol: number
  autoPayoutMaxSol: number
  dryRun: boolean
  solana: ChainPoolInfo
  robinhood: ChainPoolInfo
  /** Legacy top-level fields (Solana-oriented) */
  poolWallet: string | null
  hasPoolPrivateKey: boolean
  currency: string
  chain: string
}

export interface ReferralPaymentRow {
  id: string
  paymentType: string
  userId: string
  telegramHandle: string | null
  chain: ClaimChain
  currency: ClaimCurrency
  amountSol: number
  amountUsd: number
  recipientAddress: string | null
  recipientSource: 'custom' | 'default_wallet' | null
  status: ClaimStatus
  payoutTxHash: string | null
  payoutMode: 'auto' | 'manual' | null
  createdAt: string | null
  paidAt: string | null
  reviewedBy: string | null
  rejectReason: string | null
}

export interface ReferralPaymentsResult {
  items: ReferralPaymentRow[]
  total: number
  page: number
  totalPages: number
}

export interface PreparePayoutResult {
  success: boolean
  claimId: string
  userId: string
  chain: ClaimChain
  currency: ClaimCurrency
  amountSol: number
  amountLamports: number | null
  amountWei: string | null
  recipientAddress: string
  recipientSource: 'custom' | 'default_wallet' | null
  memo: string | null
  reason?: string
  message?: string
  details?: unknown
}

export interface ClaimActionError {
  error?: string
  reason?: string
  message?: string
  details?: unknown
}

const PAGE_SIZE = 50

function num(v: unknown, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function asChain(v: unknown): ClaimChain {
  return String(v || '').toLowerCase() === 'robinhood' ? 'robinhood' : 'solana'
}

function asCurrency(v: unknown, chain: ClaimChain): ClaimCurrency {
  const c = String(v || '').toUpperCase()
  if (c === 'ETH' || c === 'SOL') return c
  return chain === 'robinhood' ? 'ETH' : 'SOL'
}

function mapChainPool(raw: any, fallback: ClaimChain): ChainPoolInfo {
  const chain = asChain(raw?.chain ?? fallback)
  return {
    chain,
    currency: asCurrency(raw?.currency, chain),
    poolWallet: raw?.poolWallet ?? null,
    hasPoolPrivateKey: !!raw?.hasPoolPrivateKey,
  }
}

export function getAdminReviewer() {
  return (
    localStorage.getItem('stack_admin_email') ||
    localStorage.getItem('stack_admin_user') ||
    'admin@dashboard'
  )
}

export function mapPaymentRow(raw: any): ReferralPaymentRow {
  const chain = asChain(raw.chain)
  return {
    id: String(raw.id ?? raw._id ?? ''),
    paymentType: String(raw.paymentType ?? 'claim'),
    userId: String(raw.userId ?? ''),
    telegramHandle: raw.telegramHandle ?? raw.userName ?? raw.username ?? null,
    chain,
    currency: asCurrency(raw.currency, chain),
    amountSol: num(raw.amountSol ?? (raw.amountUsd == null ? raw.amount : 0)),
    amountUsd: num(raw.amountUsd ?? 0),
    recipientAddress: raw.recipientAddress ?? raw.wallet ?? raw.walletAddress ?? null,
    recipientSource:
      raw.recipientSource === 'custom' || raw.recipientSource === 'default_wallet'
        ? raw.recipientSource
        : null,
    status: String(raw.status ?? 'pending'),
    payoutTxHash: raw.payoutTxHash ?? raw.hash ?? raw.txHash ?? null,
    payoutMode: raw.payoutMode === 'auto' || raw.payoutMode === 'manual' ? raw.payoutMode : null,
    createdAt: raw.createdAt ?? raw.time ?? raw.timestamp ?? null,
    paidAt: raw.paidAt ?? null,
    reviewedBy: raw.reviewedBy ?? null,
    rejectReason: raw.rejectReason ?? null,
  }
}

function unwrapActionError(err: unknown): ClaimActionError {
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as ClaimActionError
    return {
      error: d.error,
      reason: d.reason,
      message: d.message || err.message,
      details: d.details,
    }
  }
  return { message: err instanceof Error ? err.message : 'Request failed' }
}

export async function getPayoutMode(): Promise<PayoutMode> {
  if (useMockData) {
    return {
      mode: 'manual',
      autoPayoutEnabled: false,
      minClaimSol: 0.1,
      autoPayoutMaxSol: 5,
      dryRun: false,
      solana: {
        chain: 'solana',
        currency: 'SOL',
        poolWallet: null,
        hasPoolPrivateKey: false,
      },
      robinhood: {
        chain: 'robinhood',
        currency: 'ETH',
        poolWallet: null,
        hasPoolPrivateKey: false,
      },
      poolWallet: null,
      hasPoolPrivateKey: false,
      currency: 'SOL',
      chain: 'solana',
    }
  }

  assertLiveApi()
  const res = await api.get('/api/v1/referral-payments/payout-mode')
  const solana = mapChainPool(res.data.solana, 'solana')
  const robinhood = mapChainPool(res.data.robinhood, 'robinhood')
  const hasAnyPool = !!(
    res.data.hasPoolPrivateKey ||
    solana.hasPoolPrivateKey ||
    robinhood.hasPoolPrivateKey
  )

  return {
    mode: res.data.mode === 'auto' ? 'auto' : 'manual',
    autoPayoutEnabled: !!res.data.autoPayoutEnabled,
    minClaimSol: num(res.data.minClaimSol, 0.1),
    autoPayoutMaxSol: num(res.data.autoPayoutMaxSol, 5),
    dryRun: !!res.data.dryRun,
    solana,
    robinhood,
    poolWallet: res.data.poolWallet ?? solana.poolWallet,
    hasPoolPrivateKey: hasAnyPool,
    currency: res.data.currency ?? 'SOL',
    chain: res.data.chain ?? 'solana',
  }
}

export async function getReferralPayments(params: {
  page: number
  limit?: number
  status?: string
  userId?: string
  chain?: '' | ClaimChain
}): Promise<ReferralPaymentsResult> {
  if (useMockData) {
    let items = mockPayments.map((p) =>
      mapPaymentRow({
        id: p.id,
        paymentType: 'claim',
        userId: p.userName,
        telegramHandle: p.userName,
        chain: 'solana',
        currency: 'SOL',
        amountSol: p.amount / 80,
        amountUsd: p.amount,
        status: p.status,
        payoutTxHash: p.hash === '—' ? null : p.hash,
        createdAt: p.time,
        paidAt: p.status === 'paid' ? p.time : null,
        recipientAddress: p.wallet,
        recipientSource: 'default_wallet',
      }),
    )
    if (params.status) items = items.filter((p) => p.status === params.status)
    if (params.chain) items = items.filter((p) => p.chain === params.chain)
    return { items, total: items.length, page: 1, totalPages: 1 }
  }

  assertLiveApi()
  const res = await api.get('/api/v1/referral-payments', {
    params: {
      page: params.page,
      limit: params.limit ?? PAGE_SIZE,
      ...(params.status ? { status: params.status } : {}),
      ...(params.userId ? { userId: params.userId } : {}),
      ...(params.chain ? { chain: params.chain } : {}),
    },
  })

  return {
    items: (res.data.items || []).map(mapPaymentRow),
    total: res.data.pagination?.total ?? res.data.items?.length ?? 0,
    page: res.data.pagination?.page ?? params.page,
    totalPages: res.data.pagination?.totalPages ?? 1,
  }
}

export async function getReferralPayment(claimId: string): Promise<ReferralPaymentRow> {
  if (useMockData) {
    const p = mockPayments.find((m) => m.id === claimId)
    if (!p) throw new Error('Claim not found')
    return mapPaymentRow({
      id: p.id,
      paymentType: 'claim',
      userId: p.userName,
      telegramHandle: p.userName,
      chain: 'solana',
      currency: 'SOL',
      amountSol: p.amount / 80,
      amountUsd: p.amount,
      status: p.status,
      payoutTxHash: p.hash === '—' ? null : p.hash,
      createdAt: p.time,
      recipientAddress: p.wallet,
      recipientSource: 'default_wallet',
    })
  }

  assertLiveApi()
  const res = await api.get(`/api/v1/referral-payments/${encodeURIComponent(claimId)}`)
  return mapPaymentRow(res.data)
}

export async function prepareClaimPayout(claimId: string): Promise<PreparePayoutResult> {
  if (useMockData) {
    const claim = await getReferralPayment(claimId)
    return {
      success: true,
      claimId,
      userId: claim.userId,
      chain: claim.chain,
      currency: claim.currency,
      amountSol: claim.amountSol,
      amountLamports: Math.round(claim.amountSol * 1e9),
      amountWei: null,
      recipientAddress: claim.recipientAddress || 'So11111111111111111111111111111111111111112',
      recipientSource: claim.recipientSource,
      memo: `evee-claim:${claimId}`,
    }
  }

  assertLiveApi()
  try {
    const res = await api.post(`/api/v1/referral-payments/${encodeURIComponent(claimId)}/prepare`)
    if (res.data.success === false) {
      throw Object.assign(new Error(res.data.message || 'Prepare failed'), res.data)
    }
    const chain = asChain(res.data.chain)
    const amountSol = num(res.data.amountSol)
    return {
      success: true,
      claimId: res.data.claimId ?? claimId,
      userId: String(res.data.userId ?? ''),
      chain,
      currency: asCurrency(res.data.currency, chain),
      amountSol,
      amountLamports:
        res.data.amountLamports != null
          ? num(res.data.amountLamports)
          : chain === 'solana'
            ? Math.round(amountSol * 1e9)
            : null,
      amountWei:
        res.data.amountWei != null
          ? String(res.data.amountWei)
          : chain === 'robinhood'
            ? BigInt(Math.round(amountSol * 1e18)).toString()
            : null,
      recipientAddress: String(res.data.recipientAddress ?? ''),
      recipientSource:
        res.data.recipientSource === 'custom' || res.data.recipientSource === 'default_wallet'
          ? res.data.recipientSource
          : null,
      memo: res.data.memo ?? null,
    }
  } catch (err) {
    throw unwrapActionError(err)
  }
}

export async function confirmClaimPayout(
  claimId: string,
  txHash: string,
  reviewedBy = getAdminReviewer(),
) {
  if (useMockData) {
    return { success: true, txHash, request: { status: 'paid' } }
  }

  assertLiveApi()
  try {
    const res = await api.post(`/api/v1/referral-payments/${encodeURIComponent(claimId)}/confirm`, {
      txHash,
      reviewedBy,
    })
    return res.data
  } catch (err) {
    throw unwrapActionError(err)
  }
}

export async function rejectClaim(
  claimId: string,
  reason: string,
  reviewedBy = getAdminReviewer(),
) {
  if (useMockData) {
    return { success: true, status: 'rejected' }
  }

  assertLiveApi()
  try {
    const res = await api.post(`/api/v1/referral-payments/${encodeURIComponent(claimId)}/reject`, {
      reason,
      reviewedBy,
    })
    return res.data
  } catch (err) {
    throw unwrapActionError(err)
  }
}

export async function autoPayClaim(claimId: string, reviewedBy = getAdminReviewer()) {
  if (useMockData) {
    return { success: true, status: 'paid' }
  }

  assertLiveApi()
  try {
    const res = await api.post(`/api/v1/referral-payments/${encodeURIComponent(claimId)}/auto-pay`, {
      reviewedBy,
    })
    return res.data
  } catch (err) {
    throw unwrapActionError(err)
  }
}

export async function processAutoPayouts(limit = 20) {
  if (useMockData) {
    return { processed: 0, paid: 0, results: [] }
  }

  assertLiveApi()
  try {
    const res = await api.post('/api/v1/referral-payments/process-auto', { limit })
    return res.data
  } catch (err) {
    throw unwrapActionError(err)
  }
}

export async function setReferralAutoPayout(enabled: boolean, reason?: string) {
  if (useMockData) {
    return { key: 'referralAutoPayout', enabled }
  }

  assertLiveApi()
  const res = await api.patch('/api/v1/feature-toggles/referralAutoPayout', {
    enabled,
    updatedBy: getAdminReviewer(),
    reason: reason ?? (enabled ? 'Enable auto payout' : 'Disable auto payout'),
  })
  return res.data
}

export function claimErrorMessage(err: ClaimActionError | unknown): string {
  const e = err as ClaimActionError
  const reason = e.reason
  const map: Record<string, string> = {
    not_found: 'Claim not found — refresh the list.',
    not_pending: 'Claim already handled — refresh the row.',
    eligibility_changed: 'No longer claimable (below min or over max claimable).',
    no_recipient_wallet: 'User has no wallet on this chain.',
    rh_payout_not_supported: 'Robinhood payout not supported for this claim.',
    exceeds_auto_max: 'Above auto max — use manual wallet pay.',
    invalid_tx_hash: 'Invalid signature — paste or sign again.',
    tx_verification_failed: 'Tx not verified yet — wait a few seconds and retry confirm.',
    already_paid: 'Already paid.',
    payout_failed: 'Pool send failed — retry or use manual pay.',
  }
  if (reason && map[reason]) return map[reason]
  return e.message || 'Action failed'
}

export function txExplorerUrl(chain: ClaimChain, hash: string) {
  return chain === 'robinhood'
    ? `https://robinhoodchain.blockscout.com/tx/${hash}`
    : `https://solscan.io/tx/${hash}`
}

export function hasPoolForChain(mode: PayoutMode | null, chain: ClaimChain) {
  if (!mode) return false
  return chain === 'robinhood'
    ? mode.robinhood.hasPoolPrivateKey
    : mode.solana.hasPoolPrivateKey
}
