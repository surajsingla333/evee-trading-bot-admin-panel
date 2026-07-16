import { useMockData } from '@/config/env'
import { trades as mockTrades, users as mockUsers } from '@/data/mock'
import { api, assertLiveApi } from '@/lib/api'

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface RefUser {
  userId: string
  username: string | null
  referralCode: string | null
}

/** Row from GET /api/v1/users (new contract). Nullable extras cover old-shape responses. */
export interface UserRow {
  id: string
  username: string | null
  name: string | null
  referralCode: string | null
  referredBy: RefUser | null
  referralsCount: number
  /** null when the deployed API doesn't provide it yet */
  walletCount: number | null
  /** null when the deployed API doesn't provide it yet */
  status: 'active' | 'inactive' | null
  registeredAt: string | null
  lastActive: string | null
}

export interface UsersResult {
  items: UserRow[]
  total: number
  page: number
  totalPages: number
}

export interface UserWalletItem {
  chain: 'solana' | 'robinhood'
  address: string | null
  label: string | null
  type: string | null
  isActive: boolean
  createdAt: string | null
}

export interface TradingStats {
  totalTrades: number
  buys: number
  sells: number
  failedTrades: number
  volumeUsd: number
  realizedPnlUsd: number
  solanaTrades: number
  robinhoodTrades: number
  firstTradeAt: string | null
  lastTradeAt: string | null
}

export interface PositionItem {
  tokenAddress: string
  tokenSymbol: string | null
  chain: 'solana' | 'robinhood'
  status: string
  amount: number
  totalInvested: number
  currentValue: number
  unrealizedPnL: number
  pnlPercentage: number | null
  openedAt: string | null
}

export interface LimitOrderItem {
  id: string
  tokenAddress: string
  orderType: string
  amount: number
  targetPrice: number | null
  targetPercentage: number | null
  targetMCap: number | null
  status: string
  createdAt: string | null
}

export interface ReferralBlock {
  referralCode: string | null
  referredBy: RefUser | null
  referredUsers: Array<{ userId: string; username: string | null; joinedAt: string | null }>
  referralsCount: number
  totalPaidOutSol: number
  totalPaidOutUsd: number
  pendingClaims: number
}

export interface NormalizedTrade {
  id: string
  chain: 'solana' | 'robinhood'
  type: 'buy' | 'sell'
  tokenAddress: string
  tokenSymbol: string | null
  tokenName: string | null
  amount: number | null
  nativeAmount: number
  nativeUnit: 'SOL' | 'ETH'
  priceUsd: number | null
  status: 'pending' | 'completed' | 'failed'
  provider: string | null
  txHash: string | null
  pnl: number | null
  pnlPercentage: number | null
  timestamp: string
}

export interface UserDetails {
  profile: {
    id: string
    username: string | null
    name: string | null
    referralCode: string | null
    referredBy: RefUser | null
    status: 'active' | 'inactive' | null
    registeredAt: string | null
    lastActive: string | null
    settings: Record<string, unknown>
  }
  wallets: {
    total: number
    solana: number
    robinhood: number
    items: UserWalletItem[]
  }
  /** null when the deployed API doesn't provide stats yet */
  tradingStats: TradingStats | null
  positions: { open: number; closed: number; items: PositionItem[] }
  limitOrders: { pending: number; items: LimitOrderItem[] }
  referral: ReferralBlock | null
  recentTrades: NormalizedTrade[]
  prices: { solPriceUsd: number | null; ethPriceUsd: number | null } | null
}

export interface UserTradesResult {
  items: NormalizedTrade[]
  total: number
  page: number
  totalPages: number
}

const PAGE_SIZE = 20

function refUserFrom(raw: any): RefUser | null {
  if (!raw) return null
  if (typeof raw === 'string') return { userId: raw, username: null, referralCode: null }
  return {
    userId: raw.userId ?? '',
    username: raw.username ?? null,
    referralCode: raw.referralCode ?? null,
  }
}

/** Accepts both the new UserRow contract and the old raw-Mongo shape. */
function mapListItem(raw: any): UserRow {
  if (raw.id !== undefined) {
    return {
      id: raw.id,
      username: raw.username ?? null,
      name: raw.name ?? null,
      referralCode: raw.referralCode ?? null,
      referredBy: refUserFrom(raw.referredBy),
      referralsCount: raw.referralsCount ?? 0,
      walletCount: raw.walletCount ?? null,
      status: raw.status ?? null,
      registeredAt: raw.registeredAt ?? null,
      lastActive: raw.lastActive ?? null,
    }
  }
  return {
    id: raw.userId,
    username: null,
    name: null,
    referralCode: raw.referralCode ?? null,
    referredBy: refUserFrom(raw.referredBy),
    referralsCount: raw.referrals?.length ?? 0,
    walletCount: null,
    status: null,
    registeredAt: raw.createdAt ?? null,
    lastActive: null,
  }
}

export async function getUsers(params: {
  page: number
  search?: string
  status?: '' | 'active' | 'inactive'
}): Promise<UsersResult> {
  if (useMockData) {
    const q = (params.search || '').toLowerCase()
    const filtered = mockUsers.filter(
      (u) =>
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.referralCode.toLowerCase().includes(q),
    )
    return {
      items: filtered.map((u) => ({
        id: u.id,
        username: u.email.split('@')[0],
        name: u.name,
        referralCode: u.referralCode,
        referredBy: u.referredBy
          ? { userId: u.referredBy, username: null, referralCode: u.referredBy }
          : null,
        referralsCount: 0,
        walletCount: u.walletCount,
        status: u.status === 'active' ? 'active' : 'inactive',
        registeredAt: u.registeredAt,
        lastActive: null,
      })),
      total: filtered.length,
      page: 1,
      totalPages: 1,
    }
  }

  assertLiveApi()
  const res = await api.get('/api/v1/users', {
    params: {
      page: params.page,
      limit: PAGE_SIZE,
      ...(params.search ? { search: params.search } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
  })

  return {
    items: (res.data.items || []).map(mapListItem),
    total: res.data.pagination?.total ?? res.data.items.length,
    page: res.data.pagination?.page ?? params.page,
    totalPages: res.data.pagination?.totalPages ?? 1,
  }
}

export function mapNormalizedTrade(raw: any): NormalizedTrade {
  if (raw.chain !== undefined) {
    return {
      id: raw.id ?? raw._id ?? raw.txHash ?? '',
      chain: raw.chain === 'robinhood' ? 'robinhood' : 'solana',
      type: raw.type?.toLowerCase() === 'sell' ? 'sell' : 'buy',
      tokenAddress: raw.tokenAddress ?? '',
      tokenSymbol: raw.tokenSymbol ?? null,
      tokenName: raw.tokenName ?? null,
      amount: raw.amount ?? null,
      nativeAmount: raw.nativeAmount ?? 0,
      nativeUnit: raw.nativeUnit === 'ETH' ? 'ETH' : 'SOL',
      priceUsd: raw.priceUsd ?? null,
      status:
        raw.status === 'pending' || raw.status === 'failed' ? raw.status : 'completed',
      provider: raw.provider ?? null,
      txHash: raw.txHash ?? null,
      pnl: raw.pnl ?? null,
      pnlPercentage: raw.pnlPercentage ?? null,
      timestamp: raw.timestamp ?? '',
    }
  }
  // Old solana-only Trade document
  const status = (raw.status || '').toLowerCase()
  return {
    id: raw._id ?? '',
    chain: 'solana',
    type: raw.type?.toLowerCase() === 'sell' ? 'sell' : 'buy',
    tokenAddress: raw.tokenAddress ?? '',
    tokenSymbol: raw.tokenSymbol ?? null,
    tokenName: raw.tokenName ?? null,
    amount: raw.amount ?? null,
    nativeAmount: raw.solAmount ?? 0,
    nativeUnit: 'SOL',
    priceUsd: raw.price ?? null,
    status: status === 'pending' ? 'pending' : status === 'failed' ? 'failed' : 'completed',
    provider: raw.provider ?? null,
    txHash: raw.txHash ?? null,
    pnl: raw.pnl ?? null,
    pnlPercentage: raw.pnlPercentage ?? null,
    timestamp: raw.timestamp ?? '',
  }
}

/** Accepts both the new UserDetailResponse and the old user/wallets/positions shape. */
function mapDetail(raw: any, userId: string): UserDetails {
  if (raw.profile !== undefined) {
    return {
      profile: {
        id: raw.profile.id ?? userId,
        username: raw.profile.username ?? null,
        name: raw.profile.name ?? null,
        referralCode: raw.profile.referralCode ?? null,
        referredBy: refUserFrom(raw.profile.referredBy),
        status: raw.profile.status ?? null,
        registeredAt: raw.profile.registeredAt ?? null,
        lastActive: raw.profile.lastActive ?? null,
        settings: raw.profile.settings ?? {},
      },
      wallets: {
        total: raw.wallets?.total ?? 0,
        solana: raw.wallets?.solana ?? 0,
        robinhood: raw.wallets?.robinhood ?? 0,
        items: (raw.wallets?.items || []).map((w: any) => ({
          chain: w.chain === 'robinhood' ? 'robinhood' : 'solana',
          address: w.address ?? null,
          label: w.label ?? null,
          type: w.type ?? null,
          isActive: !!w.isActive,
          createdAt: w.createdAt ?? null,
        })),
      },
      tradingStats: raw.tradingStats ?? null,
      positions: {
        open: raw.positions?.open ?? 0,
        closed: raw.positions?.closed ?? 0,
        items: (raw.positions?.items || []).map((p: any) => ({
          tokenAddress: p.tokenAddress ?? '',
          tokenSymbol: p.tokenSymbol ?? null,
          chain: p.chain === 'robinhood' ? 'robinhood' : 'solana',
          status: p.status ?? 'open',
          amount: p.amount ?? 0,
          totalInvested: p.totalInvested ?? 0,
          currentValue: p.currentValue ?? 0,
          unrealizedPnL: p.unrealizedPnL ?? 0,
          pnlPercentage: p.pnlPercentage ?? null,
          openedAt: p.openedAt ?? null,
        })),
      },
      limitOrders: {
        pending: raw.limitOrders?.pending ?? 0,
        items: (raw.limitOrders?.items || []).map((o: any) => ({
          id: o.id ?? o._id ?? '',
          tokenAddress: o.tokenAddress ?? '',
          orderType: o.orderType ?? 'buy',
          amount: o.amount ?? 0,
          targetPrice: o.targetPrice ?? null,
          targetPercentage: o.targetPercentage ?? null,
          targetMCap: o.targetMCap ?? null,
          status: o.status ?? 'pending',
          createdAt: o.createdAt ?? null,
        })),
      },
      referral: raw.referral
        ? {
            referralCode: raw.referral.referralCode ?? null,
            referredBy: refUserFrom(raw.referral.referredBy),
            referredUsers: (raw.referral.referredUsers || []).map((r: any) => ({
              userId: r.userId ?? '',
              username: r.username ?? null,
              joinedAt: r.joinedAt ?? null,
            })),
            referralsCount: raw.referral.referralsCount ?? 0,
            totalPaidOutSol: raw.referral.totalPaidOutSol ?? 0,
            totalPaidOutUsd: raw.referral.totalPaidOutUsd ?? 0,
            pendingClaims: raw.referral.pendingClaims ?? 0,
          }
        : null,
      recentTrades: (raw.recentTrades || []).map(mapNormalizedTrade),
      prices: raw.prices ?? null,
    }
  }

  // Old shape: { user, wallets, positions, recentTrades }
  const user = raw.user ?? {}
  // Only public wallet fields are mapped; the old response also carries privateKey which we drop.
  const walletItems: UserWalletItem[] = (raw.wallets || []).map((w: any) => ({
    chain: 'solana' as const,
    address: typeof w.publicKey === 'string' ? w.publicKey : null,
    label: w.nickname ?? null,
    type: w.type ?? null,
    isActive: !!w.isActive,
    createdAt: w.createdAt ?? null,
  }))

  const positionItems: PositionItem[] = []
  for (const p of raw.positions || []) {
    for (const t of p.tokens || []) {
      positionItems.push({
        tokenAddress: t.tokenAddress ?? '',
        tokenSymbol: t.tokenSymbol ?? null,
        chain: 'solana',
        status: t.status ?? 'open',
        amount: t.amount ?? 0,
        totalInvested: (t.avgBuyPrice ?? 0) * (t.amount ?? 0),
        currentValue: (t.currentPrice ?? 0) * (t.amount ?? 0),
        unrealizedPnL: t.totalPnL ?? 0,
        pnlPercentage: null,
        openedAt: t.openedAt ?? null,
      })
    }
  }

  return {
    profile: {
      id: user.userId ?? userId,
      username: null,
      name: null,
      referralCode: user.referralCode ?? null,
      referredBy: refUserFrom(user.referredBy),
      status: null,
      registeredAt: user.createdAt ?? null,
      lastActive: null,
      settings: user.settings ?? {},
    },
    wallets: {
      total: walletItems.length,
      solana: walletItems.length,
      robinhood: 0,
      items: walletItems,
    },
    tradingStats: null,
    positions: { open: positionItems.length, closed: 0, items: positionItems },
    limitOrders: { pending: 0, items: [] },
    referral: {
      referralCode: user.referralCode ?? null,
      referredBy: refUserFrom(user.referredBy),
      referredUsers: [],
      referralsCount: user.referrals?.length ?? 0,
      totalPaidOutSol: 0,
      totalPaidOutUsd: 0,
      pendingClaims: 0,
    },
    recentTrades: (raw.recentTrades || []).map(mapNormalizedTrade),
    prices: null,
  }
}

export async function getUserDetails(userId: string): Promise<UserDetails> {
  if (useMockData) {
    const u = mockUsers.find((m) => m.id === userId)
    return mapDetail(
      {
        user: {
          userId,
          referralCode: u?.referralCode ?? null,
          referredBy: u?.referredBy ?? null,
          createdAt: u?.registeredAt,
          settings: {},
          referrals: [],
        },
        wallets: [],
        positions: [],
        recentTrades: [],
      },
      userId,
    )
  }

  assertLiveApi()
  const res = await api.get(`/api/v1/users/${encodeURIComponent(userId)}`)
  return mapDetail(res.data, userId)
}

export async function getUserTrades(
  userId: string,
  params: { page: number },
): Promise<UserTradesResult> {
  if (useMockData) {
    const items: NormalizedTrade[] = mockTrades.map((t) => ({
      id: t.id,
      chain: 'solana',
      type: t.type,
      tokenAddress: t.token,
      tokenSymbol: t.tokenSymbol,
      tokenName: t.token,
      amount: t.amount,
      nativeAmount: 0,
      nativeUnit: 'SOL',
      priceUsd: t.price,
      status: t.status === 'failed' ? 'failed' : t.status === 'pending' ? 'pending' : 'completed',
      provider: t.provider,
      txHash: t.txHash,
      pnl: t.pnl,
      pnlPercentage: null,
      timestamp: t.time,
    }))
    return { items, total: items.length, page: 1, totalPages: 1 }
  }

  assertLiveApi()
  const res = await api.get(`/api/v1/users/${encodeURIComponent(userId)}/trades`, {
    params: { page: params.page, limit: PAGE_SIZE, sortDirection: 'desc' },
  })

  return {
    items: (res.data.items || []).map(mapNormalizedTrade),
    total: res.data.pagination?.total ?? res.data.items.length,
    page: res.data.pagination?.page ?? params.page,
    totalPages: res.data.pagination?.totalPages ?? 1,
  }
}
