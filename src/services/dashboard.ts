import { useMockData } from '@/config/env'
import {
  dailyUsersChart,
  kpiStats,
  recentActivity,
  referralGrowthChart,
  revenueChart,
  topTokens,
  trades,
  tradingVolumeChart,
  walletGrowthChart,
} from '@/data/mock'
import { api, assertLiveApi } from '@/lib/api'
import type {
  ApiLeaderboardEntry,
  ApiTrade,
  DashboardData,
  DashboardSummaryResponse,
  Paginated,
} from '@/types/dashboard'
import type { ActivityItem, KpiStat, Trade } from '@/types'

function mapSummaryToKpis(summary: DashboardSummaryResponse): KpiStat[] {
  return [
    { id: 'users', label: 'Total Users', value: summary.users, change: 0, format: 'number' },
    { id: 'wallets', label: 'Active Wallets', value: summary.wallets, change: 0, format: 'number' },
    { id: 'trades', label: 'Total Trades', value: summary.trades, change: 0, format: 'compact' },
    {
      id: 'volume',
      label: 'Trade Volume (SOL)',
      value: summary.tradeVolumeSol,
      change: 0,
      format: 'number',
      suffix: ' SOL',
    },
    {
      id: 'positions',
      label: 'Open Positions',
      value: summary.openPositions,
      change: 0,
      format: 'number',
    },
    {
      id: 'closed',
      label: 'Closed Positions',
      value: summary.closedPositions,
      change: 0,
      format: 'number',
    },
    {
      id: 'orders',
      label: 'Open Limit Orders',
      value: summary.openLimitOrders,
      change: 0,
      format: 'number',
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard Tokens',
      value: summary.leaderboardTokens,
      change: 0,
      format: 'number',
    },
  ]
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

function activitiesFromTrades(tradeList: Trade[]): ActivityItem[] {
  return tradeList.slice(0, 6).map((t) => ({
    id: `act_${t.id}`,
    type: 'trade' as const,
    title: `${t.tokenSymbol} ${t.type} ${t.status}`,
    description: `${t.amount} · ${t.provider}`,
    time: t.time,
  }))
}

async function fetchLiveDashboard(): Promise<DashboardData> {
  assertLiveApi()

  const [summaryRes, tradesRes, leaderboardRes] = await Promise.all([
    api.get<DashboardSummaryResponse>('/api/v1/dashboard/summary'),
    api.get<Paginated<ApiTrade>>('/api/v1/trades', { params: { page: 1, limit: 8 } }),
    api.get<Paginated<ApiLeaderboardEntry>>('/api/v1/leaderboard', {
      params: { page: 1, limit: 5, sortField: 'totalVolumeSol' },
    }),
  ])

  const mappedTrades = (tradesRes.data.items || []).map(mapApiTrade)
  const emptyChart: DashboardData['tradingVolumeChart'] = []

  return {
    kpiStats: mapSummaryToKpis(summaryRes.data),
    tradingVolumeChart: emptyChart,
    dailyUsersChart: emptyChart,
    walletGrowthChart: emptyChart,
    referralGrowthChart: emptyChart,
    revenueChart: emptyChart,
    recentActivity: activitiesFromTrades(mappedTrades),
    trades: mappedTrades,
    topTokens: (leaderboardRes.data.items || []).map((token) => ({
      symbol: token.ticker || token.tokenAddress.slice(0, 4).toUpperCase(),
      name: token.name || token.ticker || token.tokenAddress,
      volume: token.totalVolumeSol,
      change: 0,
    })),
  }
}

function fetchMockDashboard(): DashboardData {
  return {
    kpiStats,
    tradingVolumeChart,
    dailyUsersChart,
    walletGrowthChart,
    referralGrowthChart,
    revenueChart,
    recentActivity,
    trades,
    topTokens,
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  if (useMockData) return fetchMockDashboard()
  return fetchLiveDashboard()
}
