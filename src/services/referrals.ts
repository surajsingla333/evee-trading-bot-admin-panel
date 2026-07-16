import { useMockData } from '@/config/env'
import { referralPayments as mockPayments, referrals as mockReferrals } from '@/data/mock'
import { api, assertLiveApi } from '@/lib/api'

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ReferralRow {
  id: string
  userId: string
  userName: string | null
  code: string | null
  referrals: number
  activeReferrals: number
  volumeSol: number
  volumeEth: number
  volumeUsd: number
  /** USD when available; falls back to SOL-denominated balance on older APIs */
  pendingRewards: number
  pendingRewardsSol: number | null
  paidRewards: number
  paidRewardsSol: number | null
  claimableRewards: number
  claimableRewardsSol: number | null
  status: 'active' | 'inactive'
}

export interface ReferredUser {
  userId: string
  username: string | null
  joinedAt: string | null
  traded: boolean
  volumeUsd: number
}

export interface ClaimHistoryItem {
  id: string
  amountSol: number
  amountUsd: number
  status: 'pending' | 'paid' | 'failed'
  wallet: string | null
  txHash: string | null
  createdAt: string | null
}

export interface ReferralDetail {
  userId: string
  userName: string | null
  code: string | null
  status: 'active' | 'inactive'
  referrals: number
  activeReferrals: number
  volumeSol: number
  volumeEth: number
  volumeUsd: number
  pendingRewards: number
  paidRewards: number
  claimableRewards: number
  referredUsers: ReferredUser[]
  claims: ClaimHistoryItem[]
}

export interface ReferralPaymentRow {
  id: string
  userId: string | null
  userName: string | null
  amount: number
  amountSol: number | null
  status: 'pending' | 'paid' | 'failed'
  wallet: string | null
  hash: string | null
  time: string | null
}

export interface ReferralsResult {
  items: ReferralRow[]
  total: number
  page: number
  totalPages: number
}

export interface ReferralPaymentsResult {
  items: ReferralPaymentRow[]
  total: number
  page: number
  totalPages: number
}

const PAGE_SIZE = 20

function num(v: unknown, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/** Maps Claim v2 rows and the older admin referral summary. */
export function mapReferralRow(raw: any): ReferralRow {
  const userId = String(raw.userId ?? raw.id ?? '')
  const code = raw.code ?? raw.referralCode ?? null
  const status: ReferralRow['status'] =
    raw.status === 'active' || raw.status === 'inactive'
      ? raw.status
      : raw.isActive
        ? 'active'
        : 'inactive'

  const pendingRewards = num(
    raw.pendingRewardsUsd ?? raw.pendingRewards ?? raw.pendingBalance,
  )
  const paidRewards = num(raw.paidRewardsUsd ?? raw.paidRewards ?? raw.totalPaidOut)
  const claimableRewards = num(
    raw.claimableRewardsUsd ?? raw.claimableRewards ?? raw.pendingBalance,
  )

  return {
    id: raw.id ?? userId,
    userId,
    userName: raw.userName ?? raw.username ?? null,
    code,
    referrals: num(raw.referrals ?? raw.totalReferrals),
    activeReferrals: num(raw.activeReferrals),
    volumeSol: num(raw.volumeSol),
    volumeEth: num(raw.volumeEth),
    volumeUsd: num(raw.volumeUsd),
    pendingRewards,
    pendingRewardsSol:
      raw.pendingRewardsSol != null
        ? num(raw.pendingRewardsSol)
        : raw.pendingBalance != null && raw.pendingRewardsUsd == null
          ? num(raw.pendingBalance)
          : null,
    paidRewards,
    paidRewardsSol:
      raw.paidRewardsSol != null
        ? num(raw.paidRewardsSol)
        : raw.totalPaidOut != null && raw.paidRewardsUsd == null
          ? num(raw.totalPaidOut)
          : null,
    claimableRewards,
    claimableRewardsSol:
      raw.claimableRewardsSol != null ? num(raw.claimableRewardsSol) : null,
    status,
  }
}

function mapClaim(raw: any): ClaimHistoryItem {
  const statusRaw = (raw.status || '').toLowerCase()
  const status: ClaimHistoryItem['status'] =
    statusRaw === 'paid' || statusRaw === 'completed'
      ? 'paid'
      : statusRaw === 'failed' || statusRaw === 'error'
        ? 'failed'
        : 'pending'

  return {
    id: String(raw.id ?? raw._id ?? raw.claimId ?? ''),
    amountSol: num(raw.amountSol ?? raw.amount),
    amountUsd: num(raw.amountUsd ?? raw.amountUsdEquivalent ?? 0),
    status,
    wallet: raw.wallet ?? raw.walletAddress ?? raw.publicKey ?? null,
    txHash: raw.txHash ?? raw.hash ?? raw.signature ?? null,
    createdAt: raw.createdAt ?? raw.time ?? raw.paidAt ?? raw.timestamp ?? null,
  }
}

function mapReferredUser(raw: any): ReferredUser {
  return {
    userId: String(raw.userId ?? raw.id ?? ''),
    username: raw.username ?? raw.userName ?? null,
    joinedAt: raw.joinedAt ?? raw.createdAt ?? null,
    traded: !!(raw.traded ?? raw.isActive ?? raw.active),
    volumeUsd: num(raw.volumeUsd ?? raw.volume),
  }
}

export function mapReferralDetail(raw: any, userId: string): ReferralDetail {
  // Claim v2 shape
  if (raw.referredUsers !== undefined || raw.claims !== undefined || raw.code !== undefined) {
    return {
      userId: String(raw.userId ?? userId),
      userName: raw.userName ?? raw.username ?? null,
      code: raw.code ?? raw.referralCode ?? null,
      status:
        raw.status === 'inactive' || raw.isActive === false ? 'inactive' : 'active',
      referrals: num(raw.referrals ?? raw.totalReferrals ?? raw.referredUsers?.length),
      activeReferrals: num(raw.activeReferrals),
      volumeSol: num(raw.volumeSol),
      volumeEth: num(raw.volumeEth),
      volumeUsd: num(raw.volumeUsd),
      pendingRewards: num(raw.pendingRewardsUsd ?? raw.pendingRewards),
      paidRewards: num(raw.paidRewardsUsd ?? raw.paidRewards),
      claimableRewards: num(raw.claimableRewardsUsd ?? raw.claimableRewards),
      referredUsers: (raw.referredUsers || raw.directReferrals || []).map(mapReferredUser),
      claims: (raw.claims || raw.claimHistory || raw.payouts || []).map(mapClaim),
    }
  }

  // Older detail shape
  const balance = raw.balance ?? {}
  return {
    userId: String(raw.userId ?? userId),
    userName: null,
    code: raw.relationship?.referralCode ?? null,
    status: (raw.directReferrals || []).length > 0 ? 'active' : 'inactive',
    referrals: (raw.directReferrals || []).length,
    activeReferrals: (raw.directReferrals || []).filter((r: any) => r.isActive).length,
    volumeSol: num(balance.volumeSol),
    volumeEth: num(balance.volumeEth),
    volumeUsd: num(balance.volumeUsd),
    pendingRewards: num(balance.pendingBalance ?? balance.pendingRewards),
    paidRewards: num(balance.totalPaidOut ?? balance.paidRewards),
    claimableRewards: num(balance.pendingBalance ?? balance.claimableRewards),
    referredUsers: (raw.directReferrals || []).map(mapReferredUser),
    claims: [...(raw.payouts || []), ...(raw.commissions || [])].map(mapClaim),
  }
}

export function mapPaymentRow(raw: any): ReferralPaymentRow {
  const statusRaw = (raw.status || '').toLowerCase()
  const status: ReferralPaymentRow['status'] =
    statusRaw === 'paid' || statusRaw === 'completed'
      ? 'paid'
      : statusRaw === 'failed' || statusRaw === 'error'
        ? 'failed'
        : 'pending'

  return {
    id: String(raw.id ?? raw._id ?? ''),
    userId: raw.userId != null ? String(raw.userId) : null,
    userName: raw.userName ?? raw.username ?? null,
    amount: num(raw.amountUsd ?? raw.amount),
    amountSol: raw.amountSol != null ? num(raw.amountSol) : null,
    status,
    wallet: raw.wallet ?? raw.walletAddress ?? null,
    hash: raw.hash ?? raw.txHash ?? raw.signature ?? null,
    time: raw.time ?? raw.createdAt ?? raw.paidAt ?? raw.timestamp ?? null,
  }
}

export async function getReferrals(params: {
  page: number
  search?: string
  status?: '' | 'active' | 'inactive'
}): Promise<ReferralsResult> {
  if (useMockData) {
    let items: ReferralRow[] = mockReferrals.map((r) =>
      mapReferralRow({
        ...r,
        activeReferrals: Math.max(0, Math.floor(r.referrals * 0.6)),
        volumeSol: r.paidRewards / 80,
        volumeEth: 0,
        volumeUsd: r.paidRewards * 4,
        pendingRewardsUsd: r.pendingRewards,
        paidRewardsUsd: r.paidRewards,
        claimableRewardsUsd: r.pendingRewards,
      }),
    )
    const q = (params.search || '').toLowerCase()
    if (q) {
      items = items.filter(
        (r) =>
          r.userId.toLowerCase().includes(q) ||
          (r.userName || '').toLowerCase().includes(q) ||
          (r.code || '').toLowerCase().includes(q),
      )
    }
    if (params.status) items = items.filter((r) => r.status === params.status)
    return { items, total: items.length, page: 1, totalPages: 1 }
  }

  assertLiveApi()
  const res = await api.get('/api/v1/referrals', {
    params: {
      page: params.page,
      limit: PAGE_SIZE,
      ...(params.search ? { search: params.search } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
  })

  return {
    items: (res.data.items || []).map(mapReferralRow),
    total: res.data.pagination?.total ?? res.data.items?.length ?? 0,
    page: res.data.pagination?.page ?? params.page,
    totalPages: res.data.pagination?.totalPages ?? 1,
  }
}

export async function getReferralDetail(userId: string): Promise<ReferralDetail> {
  if (useMockData) {
    const row = mockReferrals.find((r) => r.userId === userId)
    return mapReferralDetail(
      {
        userId,
        userName: row?.userName ?? null,
        code: row?.code ?? null,
        status: row?.status ?? 'inactive',
        referrals: row?.referrals ?? 0,
        activeReferrals: Math.floor((row?.referrals ?? 0) * 0.6),
        volumeUsd: (row?.paidRewards ?? 0) * 4,
        volumeSol: (row?.paidRewards ?? 0) / 80,
        volumeEth: 0,
        pendingRewardsUsd: row?.pendingRewards ?? 0,
        paidRewardsUsd: row?.paidRewards ?? 0,
        claimableRewardsUsd: row?.pendingRewards ?? 0,
        referredUsers: [],
        claims: mockPayments
          .filter((p) => p.userName === row?.userName)
          .map((p) => ({
            id: p.id,
            amountUsd: p.amount,
            amountSol: p.amount / 80,
            status: p.status,
            wallet: p.wallet,
            txHash: p.hash === '—' ? null : p.hash,
            createdAt: p.time,
          })),
      },
      userId,
    )
  }

  assertLiveApi()
  const res = await api.get(`/api/v1/referrals/${encodeURIComponent(userId)}`)
  return mapReferralDetail(res.data, userId)
}

export async function getReferralPayments(params: {
  page: number
  status?: '' | 'pending' | 'paid' | 'failed'
}): Promise<ReferralPaymentsResult> {
  if (useMockData) {
    let items = mockPayments.map(mapPaymentRow)
    if (params.status) items = items.filter((p) => p.status === params.status)
    return { items, total: items.length, page: 1, totalPages: 1 }
  }

  assertLiveApi()
  const res = await api.get('/api/v1/referral-payments', {
    params: {
      page: params.page,
      limit: PAGE_SIZE,
      ...(params.status ? { status: params.status } : {}),
    },
  })

  return {
    items: (res.data.items || []).map(mapPaymentRow),
    total: res.data.pagination?.total ?? res.data.items?.length ?? 0,
    page: res.data.pagination?.page ?? params.page,
    totalPages: res.data.pagination?.totalPages ?? 1,
  }
}
