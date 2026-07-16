import type { ActivityItem, ChartPoint, KpiStat, Trade } from '@/types'

export interface DashboardData {
  kpiStats: KpiStat[]
  generatedAt?: string
  tradingVolumeChart: ChartPoint[]
  dailyUsersChart: ChartPoint[]
  walletGrowthChart: ChartPoint[]
  referralGrowthChart: ChartPoint[]
  revenueChart: ChartPoint[]
  recentActivity: ActivityItem[]
  trades: Trade[]
}

export interface DashboardSummaryResponse {
  users: number
  wallets: number
  openLimitOrders: number
  leaderboardTokens: number
  trades: number
  tradeVolumeSol: number
  openPositions: number
  closedPositions: number
  botData?: {
    walletDocuments: number
    settingsDocuments: number
    tradeDocuments: number
  }
}

export interface Paginated<T> {
  items: T[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface ApiTrade {
  _id: string
  type: string
  tokenAddress: string
  tokenSymbol?: string | null
  tokenName?: string | null
  amount: number
  price: number
  solAmount?: number
  txHash?: string
  provider?: string
  slippage?: number
  status?: string
  pnl?: number | null
  pnlPercentage?: number | null
  timestamp?: string
  wallet?: string | { publicKey?: string }
}

export interface ApiLeaderboardEntry {
  _id: string
  tokenAddress: string
  ticker: string
  name: string
  totalBuys: number
  totalSells: number
  holders: number
  totalVolumeSol: number
  lastTradeAt?: string
}
