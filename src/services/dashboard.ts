import axios from 'axios'
import { useMockData } from '@/config/env'
import {
  dailyUsersChart,
  kpiStats,
  recentActivity,
  referralGrowthChart,
  revenueChart,
  trades,
  tradingVolumeChart,
  walletGrowthChart,
} from '@/data/mock'
import { api, assertLiveApi } from '@/lib/api'
import type { ApiTrade, DashboardData, Paginated } from '@/types/dashboard'
import type { ActivityItem, KpiStat, Trade } from '@/types'

export type StatsPeriod = '7d' | '30d' | '90d'

interface StatsChartPoint {
  date: string
  value: number
}

interface DashboardStatsResponse {
  period: string
  generatedAt: string
  items: KpiStat[]
  prices?: {
    solPriceUsd: number | null
    ethPriceUsd: number | null
  }
  charts?: {
    tradingVolume?: StatsChartPoint[]
    dailyUsers?: StatsChartPoint[]
    walletGrowth?: StatsChartPoint[]
    referralGrowth?: StatsChartPoint[]
    revenue?: StatsChartPoint[]
  }
}

interface DashboardSummaryResponse {
  users: number
  wallets: number
  openLimitOrders: number
  leaderboardTokens: number
  trades: number
  tradeVolumeSol: number
  openPositions: number
  closedPositions: number
}

/** Fallback while the deployed API doesn't have /dashboard/stats yet */
async function fetchStatsWithFallback(period: StatsPeriod): Promise<DashboardStatsResponse> {
  try {
    const res = await api.get<DashboardStatsResponse>('/api/v1/dashboard/stats', {
      params: { period },
    })
    return res.data
  } catch (err) {
    if (!axios.isAxiosError(err) || err.response?.status !== 404) throw err

    const res = await api.get<DashboardSummaryResponse>('/api/v1/dashboard/summary')
    const s = res.data
    return {
      period,
      generatedAt: new Date().toISOString(),
      items: [
        { id: 'users', label: 'Total Users', value: s.users, change: null, format: 'number' },
        { id: 'wallets', label: 'Active Wallets', value: s.wallets, change: null, format: 'number' },
        { id: 'trades', label: 'Total Trades', value: s.trades, change: null, format: 'compact' },
        {
          id: 'volume',
          label: 'Trade Volume',
          value: s.tradeVolumeSol,
          change: null,
          format: 'number',
          suffix: ' SOL',
        },
        { id: 'positions', label: 'Open Positions', value: s.openPositions, change: null, format: 'number' },
        { id: 'closed', label: 'Closed Positions', value: s.closedPositions, change: null, format: 'number' },
        { id: 'orders', label: 'Open Limit Orders', value: s.openLimitOrders, change: null, format: 'number' },
        { id: 'leaderboard', label: 'Leaderboard Tokens', value: s.leaderboardTokens, change: null, format: 'number' },
      ],
    }
  }
}

function mapTradeStatus(status?: string): Trade['status'] {
  switch ((status || '').toLowerCase()) {
    case 'completed':
    case 'filled':
    case 'success':
      return 'filled'
    case 'partial':
      return 'partial'
    case 'failed':
    case 'error':
      return 'failed'
    default:
      return 'pending'
  }
}

function mapApiTrade(t: ApiTrade): Trade {
  const wallet =
    typeof t.wallet === 'string'
      ? t.wallet
      : t.wallet?.publicKey || t.tokenAddress?.slice(0, 8) || '—'

  return {
    id: t._id,
    token: t.tokenName || t.tokenSymbol || t.tokenAddress,
    tokenSymbol: t.tokenSymbol || t.tokenAddress?.slice(0, 4).toUpperCase() || '???',
    type: t.type?.toLowerCase() === 'sell' ? 'sell' : 'buy',
    amount: t.amount ?? t.solAmount ?? 0,
    price: t.price ?? 0,
    provider: t.provider || '—',
    slippage: t.slippage ?? 0,
    pnl: t.pnl ?? 0,
    status: mapTradeStatus(t.status),
    time: t.timestamp || new Date().toISOString(),
    wallet,
    txHash: t.txHash || '',
  }
}

interface RecentActivityResponse {
  items: ActivityItem[]
  total: number
}

/** Returns null when the deployed API doesn't have /dashboard/recent-activity yet */
async function fetchRecentActivity(): Promise<ActivityItem[] | null> {
  try {
    const res = await api.get<RecentActivityResponse>('/api/v1/dashboard/recent-activity', {
      params: { limit: 8 },
    })
    return res.data.items || []
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null
    throw err
  }
}

function activitiesFromTrades(tradeList: Trade[]): ActivityItem[] {
  return tradeList.slice(0, 6).map((t) => ({
    id: `act_${t.id}`,
    type: 'trade' as const,
    title: `${t.tokenSymbol} ${t.type} ${t.status}`,
    description: `${t.amount} · ${t.provider}`,
    time: t.time,
  }))
}

async function fetchLiveDashboard(period: StatsPeriod): Promise<DashboardData> {
  assertLiveApi()

  const [stats, activity, tradesRes] = await Promise.all([
    fetchStatsWithFallback(period),
    fetchRecentActivity(),
    api.get<Paginated<ApiTrade>>('/api/v1/trades', { params: { page: 1, limit: 8 } }),
  ])

  const mappedTrades = (tradesRes.data.items || []).map(mapApiTrade)
  const charts = stats.charts

  return {
    kpiStats: (stats.items || []).filter((s) => s.id !== 'features'),
    generatedAt: stats.generatedAt,
    tradingVolumeChart: charts?.tradingVolume ?? [],
    dailyUsersChart: charts?.dailyUsers ?? [],
    walletGrowthChart: charts?.walletGrowth ?? [],
    referralGrowthChart: charts?.referralGrowth ?? [],
    revenueChart: charts?.revenue ?? [],
    recentActivity: activity ?? activitiesFromTrades(mappedTrades),
    trades: mappedTrades,
  }
}

function fetchMockDashboard(): DashboardData {
  return {
    kpiStats: kpiStats.filter((s) => s.id !== 'features'),
    tradingVolumeChart,
    dailyUsersChart,
    walletGrowthChart,
    referralGrowthChart,
    revenueChart,
    recentActivity,
    trades,
  }
}

export async function getDashboardData(period: StatsPeriod = '30d'): Promise<DashboardData> {
  if (useMockData) return fetchMockDashboard()
  return fetchLiveDashboard(period)
}
