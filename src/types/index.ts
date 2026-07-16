export type Status = 'active' | 'inactive' | 'pending' | 'suspended' | 'failed' | 'executed' | 'cancelled'

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'pending'

export interface NavItem {
  label: string
  href: string
  icon: string
}

export interface KpiStat {
  id: string
  label: string
  value: number
  prefix?: string
  suffix?: string
  /** % vs the previous period; null when no prior data exists */
  change: number | null
  format: 'number' | 'currency' | 'compact'
  /** present on monetary KPIs — values are converted to USD */
  unit?: 'USD'
  /** present on monetary KPIs — native amounts + prices used */
  breakdown?: {
    solanaVolumeSol?: number
    robinhoodVolumeEth?: number
    amountSol?: number
    solanaWallets?: number
    robinhoodWallets?: number
    solPriceUsd?: number | null
    ethPriceUsd?: number | null
  }
}

export interface ChartPoint {
  date: string
  value: number
  secondary?: number
}

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  referralCode: string
  status: 'active' | 'inactive' | 'suspended'
  walletCount: number
  registeredAt: string
  referredBy?: string
}

export interface Wallet {
  id: string
  address: string
  nickname: string
  balance: number
  type: 'hot' | 'cold' | 'trading' | 'referral'
  status: 'active' | 'inactive' | 'locked'
  userId: string
  pnl: number
  assets: WalletAsset[]
}

export interface WalletAsset {
  symbol: string
  name: string
  amount: number
  value: number
  change24h: number
}

export interface Trade {
  id: string
  token: string
  tokenSymbol: string
  type: 'buy' | 'sell'
  amount: number
  price: number
  provider: string
  slippage: number
  pnl: number
  status: 'filled' | 'partial' | 'failed' | 'pending'
  time: string
  wallet: string
  txHash: string
}

export interface Position {
  id: string
  token: string
  symbol: string
  holdings: number
  value: number
  cost: number
  pnl: number
  pnlPercent: number
  allocation: number
  logo?: string
}

export interface LimitOrder {
  id: string
  token: string
  symbol: string
  side: 'buy' | 'sell'
  amount: number
  limitPrice: number
  currentPrice: number
  status: 'pending' | 'executed' | 'cancelled' | 'failed'
  createdAt: string
  expiresAt: string
  wallet: string
}

export interface LeaderboardEntry {
  rank: number
  token: string
  symbol: string
  volume: number
  buys: number
  sells: number
  holders: number
  change24h: number
}

export interface Referral {
  id: string
  userId: string
  userName: string
  code: string
  referrals: number
  pendingRewards: number
  paidRewards: number
  level: number
  status: 'active' | 'inactive'
}

export interface ReferralPayment {
  id: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  wallet: string
  hash: string
  time: string
  userName: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  avatar: string
  role: string
  permissions: string[]
  lastActive: string
  actionsToday: number
}

export interface FeatureToggle {
  id: string
  name: string
  description: string
  enabled: boolean
  updatedBy: string
  updatedAt: string
  category: string
}

export interface BotStorageItem {
  key: string
  updatedAt: string
  size: string
  value: Record<string, unknown>
}

export interface ActivityItem {
  id: string
  type: 'trade' | 'user' | 'wallet' | 'referral' | 'system'
  title: string
  description: string
  time: string
}
