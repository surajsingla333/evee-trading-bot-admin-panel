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
  /** SOL */
  pendingRewards: number
  pendingRewardsUsd: number
  /** SOL */
  paidRewards: number
  paidRewardsUsd: number
  /** SOL remaining */
  claimableRewards: number
  claimableRewardsUsd: number
  pendingClaims: number
  status: 'active' | 'inactive'
  lastVolumeAt: string | null
}

export interface ReferredUser {
  userId: string
  userName: string | null
  referralCode: string | null
  registeredAt: string | null
  /** Present when derived from older APIs / volume.activeTraderIds */
  traded: boolean
}

export interface ClaimHistoryItem {
  id: string
  status: string
  amountSol: number
  telegramHandle: string | null
  payoutTxHash: string | null
  createdAt: string | null
  paidAt: string | null
}

export interface ReferralVolume {
  solLamports: string
  ethWei: string
  activeTraderIds: string[]
  updatedAt: string | null
}

export interface ReferralDetail {
  referrer: ReferralRow | null
  referredUsers: ReferredUser[]
  claims: ClaimHistoryItem[]
  volume: ReferralVolume | null
  prices: { solPriceUsd: number | null; ethPriceUsd: number | null }
  rewardRate: number
}

export interface ReferralsResult {
  items: ReferralRow[]
  total: number
  page: number
  totalPages: number
  prices: { solPriceUsd: number | null; ethPriceUsd: number | null }
  rewardRate: number
}

const PAGE_SIZE = 20

function num(v: unknown, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/** Maps Claim v2 Referral rows; falls back for older admin referral summaries. */
export function mapReferralRow(raw: any): ReferralRow {
  const userId = String(raw.userId ?? raw.id ?? '')
  const code = raw.code ?? raw.referralCode ?? null
  const status: ReferralRow['status'] =
    raw.status === 'active' || raw.status === 'inactive'
      ? raw.status
      : raw.isActive
        ? 'active'
        : 'inactive'

  // New shape: pendingRewards / paidRewards / claimableRewards are SOL.
  // Older shape only had pendingBalance / totalPaidOut (SOL) without USD pairs.
  const hasUsdPairs =
    raw.pendingRewardsUsd != null ||
    raw.paidRewardsUsd != null ||
    raw.claimableRewardsUsd != null

  const pendingRewards = num(raw.pendingRewards ?? raw.pendingBalance)
  const paidRewards = num(raw.paidRewards ?? raw.totalPaidOut)
  const claimableRewards = num(raw.claimableRewards ?? raw.pendingBalance)

  return {
    id: String(raw.id ?? userId),
    userId,
    userName: raw.userName ?? raw.username ?? null,
    code,
    referrals: num(raw.referrals ?? raw.totalReferrals),
    activeReferrals: num(raw.activeReferrals),
    volumeSol: num(raw.volumeSol),
    volumeEth: num(raw.volumeEth),
    volumeUsd: num(raw.volumeUsd),
    pendingRewards,
    pendingRewardsUsd: hasUsdPairs
      ? num(raw.pendingRewardsUsd)
      : num(raw.pendingRewardsUsd ?? 0),
    paidRewards,
    paidRewardsUsd: hasUsdPairs ? num(raw.paidRewardsUsd) : num(raw.paidRewardsUsd ?? 0),
    claimableRewards,
    claimableRewardsUsd: hasUsdPairs
      ? num(raw.claimableRewardsUsd)
      : num(raw.claimableRewardsUsd ?? 0),
    pendingClaims: num(raw.pendingClaims),
    status,
    lastVolumeAt: raw.lastVolumeAt ?? raw.lastActivityDate ?? null,
  }
}

function mapClaim(raw: any): ClaimHistoryItem {
  return {
    id: String(raw.id ?? raw._id ?? raw.claimId ?? ''),
    status: String(raw.status ?? 'pending'),
    amountSol: num(raw.amountSol ?? raw.amount),
    telegramHandle: raw.telegramHandle ?? raw.username ?? null,
    payoutTxHash: raw.payoutTxHash ?? raw.txHash ?? raw.hash ?? raw.signature ?? null,
    createdAt: raw.createdAt ?? raw.time ?? null,
    paidAt: raw.paidAt ?? null,
  }
}

function mapReferredUser(raw: any, activeTraderIds: Set<string> = new Set()): ReferredUser {
  const userId = String(raw.userId ?? raw.id ?? '')
  return {
    userId,
    userName: raw.userName ?? raw.username ?? null,
    referralCode: raw.referralCode ?? raw.code ?? null,
    registeredAt: raw.registeredAt ?? raw.joinedAt ?? raw.createdAt ?? null,
    traded: activeTraderIds.has(userId) || !!(raw.traded ?? raw.isActive ?? raw.active),
  }
}

function mapVolume(raw: any): ReferralVolume | null {
  if (!raw || typeof raw !== 'object') return null
  return {
    solLamports: String(raw.solLamports ?? '0'),
    ethWei: String(raw.ethWei ?? '0'),
    activeTraderIds: Array.isArray(raw.activeTraderIds)
      ? raw.activeTraderIds.map(String)
      : [],
    updatedAt: raw.updatedAt ?? null,
  }
}

/** Maps GET /api/v1/referrals/{userId} ReferralDetails (+ older shapes). */
export function mapReferralDetail(raw: any, userId: string): ReferralDetail {
  // New Claim v2 detail: { referrer, referredUsers, claims, volume, prices, rewardRate }
  if (raw.referrer !== undefined || (raw.referredUsers !== undefined && raw.prices !== undefined)) {
    const volume = mapVolume(raw.volume)
    const activeIds = new Set(volume?.activeTraderIds ?? [])
    return {
      referrer: raw.referrer ? mapReferralRow(raw.referrer) : null,
      referredUsers: (raw.referredUsers || []).map((u: any) => mapReferredUser(u, activeIds)),
      claims: (raw.claims || []).map(mapClaim),
      volume,
      prices: {
        solPriceUsd: raw.prices?.solPriceUsd ?? null,
        ethPriceUsd: raw.prices?.ethPriceUsd ?? null,
      },
      rewardRate: num(raw.rewardRate, 0.001),
    }
  }

  // Flat referral-shaped payload (or older wrappers)
  if (raw.referredUsers !== undefined || raw.claims !== undefined || raw.code !== undefined) {
    const referrerSource = raw.referrer ?? raw
    return {
      referrer: mapReferralRow({ ...referrerSource, userId: referrerSource.userId ?? userId }),
      referredUsers: (raw.referredUsers || raw.directReferrals || []).map((u: any) =>
        mapReferredUser(u),
      ),
      claims: (raw.claims || raw.claimHistory || raw.payouts || []).map(mapClaim),
      volume: mapVolume(raw.volume),
      prices: {
        solPriceUsd: raw.prices?.solPriceUsd ?? null,
        ethPriceUsd: raw.prices?.ethPriceUsd ?? null,
      },
      rewardRate: num(raw.rewardRate, 0.001),
    }
  }

  // Oldest detail shape: { userId, relationship, balance, directReferrals, commissions, payouts }
  const balance = raw.balance ?? {}
  return {
    referrer: mapReferralRow({
      id: userId,
      userId,
      code: raw.relationship?.referralCode ?? null,
      referrals: (raw.directReferrals || []).length,
      activeReferrals: (raw.directReferrals || []).filter((r: any) => r.isActive).length,
      volumeSol: balance.volumeSol,
      volumeEth: balance.volumeEth,
      volumeUsd: balance.volumeUsd,
      pendingRewards: balance.pendingBalance ?? balance.pendingRewards,
      paidRewards: balance.totalPaidOut ?? balance.paidRewards,
      claimableRewards: balance.pendingBalance ?? balance.claimableRewards,
      status: (raw.directReferrals || []).length > 0 ? 'active' : 'inactive',
    }),
    referredUsers: (raw.directReferrals || []).map((u: any) => mapReferredUser(u)),
    claims: [...(raw.payouts || []), ...(raw.commissions || [])].map(mapClaim),
    volume: null,
    prices: { solPriceUsd: null, ethPriceUsd: null },
    rewardRate: 0.001,
  }
}

export async function getReferrals(params: {
  page: number
  search?: string
  status?: '' | 'active' | 'inactive'
}): Promise<ReferralsResult> {
  if (useMockData) {
    const solPrice = 77.31
    let items: ReferralRow[] = mockReferrals.map((r) => {
      const pendingSol = r.pendingRewards / solPrice
      const paidSol = r.paidRewards / solPrice
      return mapReferralRow({
        id: r.userId,
        userId: r.userId,
        userName: r.userName,
        code: r.code,
        referrals: r.referrals,
        activeReferrals: Math.max(0, Math.floor(r.referrals * 0.6)),
        volumeSol: r.paidRewards / solPrice,
        volumeEth: 0,
        volumeUsd: r.paidRewards * 4,
        pendingRewards: pendingSol,
        pendingRewardsUsd: r.pendingRewards,
        paidRewards: paidSol,
        paidRewardsUsd: r.paidRewards,
        claimableRewards: pendingSol,
        claimableRewardsUsd: r.pendingRewards,
        pendingClaims: r.pendingRewards > 0 ? 1 : 0,
        status: r.status,
        lastVolumeAt: null,
      })
    })
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
    return {
      items,
      total: items.length,
      page: 1,
      totalPages: 1,
      prices: { solPriceUsd: solPrice, ethPriceUsd: 1920.88 },
      rewardRate: 0.001,
    }
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
    prices: {
      solPriceUsd: res.data.prices?.solPriceUsd ?? null,
      ethPriceUsd: res.data.prices?.ethPriceUsd ?? null,
    },
    rewardRate: num(res.data.rewardRate, 0.001),
  }
}

export async function getReferralDetail(userId: string): Promise<ReferralDetail> {
  if (useMockData) {
    const row = mockReferrals.find((r) => r.userId === userId)
    const solPrice = 77.31
    const pendingSol = (row?.pendingRewards ?? 0) / solPrice
    const paidSol = (row?.paidRewards ?? 0) / solPrice
    return mapReferralDetail(
      {
        referrer: row
          ? {
              id: row.userId,
              userId: row.userId,
              userName: row.userName,
              code: row.code,
              referrals: row.referrals,
              activeReferrals: Math.floor(row.referrals * 0.6),
              volumeSol: paidSol,
              volumeEth: 0,
              volumeUsd: (row.paidRewards ?? 0) * 4,
              pendingRewards: pendingSol,
              pendingRewardsUsd: row.pendingRewards,
              paidRewards: paidSol,
              paidRewardsUsd: row.paidRewards,
              claimableRewards: pendingSol,
              claimableRewardsUsd: row.pendingRewards,
              pendingClaims: row.pendingRewards > 0 ? 1 : 0,
              status: row.status,
              lastVolumeAt: null,
            }
          : null,
        referredUsers: [],
        claims: mockPayments
          .filter((p) => p.userName === row?.userName)
          .map((p) => ({
            id: p.id,
            status: p.status,
            amountSol: p.amount / solPrice,
            telegramHandle: null,
            payoutTxHash: p.hash === '—' ? null : p.hash,
            createdAt: p.time,
            paidAt: p.status === 'paid' ? p.time : null,
          })),
        volume: {
          solLamports: String(Math.round(paidSol * 1e9)),
          ethWei: '0',
          activeTraderIds: [],
          updatedAt: null,
        },
        prices: { solPriceUsd: solPrice, ethPriceUsd: 1920.88 },
        rewardRate: 0.001,
      },
      userId,
    )
  }

  assertLiveApi()
  const res = await api.get(`/api/v1/referrals/${encodeURIComponent(userId)}`)
  return mapReferralDetail(res.data, userId)
}
