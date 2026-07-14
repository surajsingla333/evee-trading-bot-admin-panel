import type {
  ActivityItem,
  AdminUser,
  BotStorageItem,
  ChartPoint,
  FeatureToggle,
  KpiStat,
  LeaderboardEntry,
  LimitOrder,
  Position,
  Referral,
  ReferralPayment,
  Trade,
  User,
  Wallet,
} from '@/types'

export const kpiStats: KpiStat[] = [
  { id: 'users', label: 'Total Users', value: 12847, change: 12.4, format: 'number' },
  { id: 'wallets', label: 'Active Wallets', value: 8921, change: 8.2, format: 'number' },
  { id: 'trades', label: 'Total Trades', value: 384512, change: 18.7, format: 'compact' },
  { id: 'volume', label: 'Trading Volume', value: 48200000, change: 24.1, format: 'currency' },
  { id: 'positions', label: 'Open Positions', value: 3241, change: -3.2, format: 'number' },
  { id: 'referral', label: 'Referral Revenue', value: 184200, change: 15.6, format: 'currency' },
  { id: 'platform', label: 'Platform Revenue', value: 1240000, change: 9.8, format: 'currency' },
  { id: 'features', label: 'Active Features', value: 24, change: 2.0, format: 'number' },
]

const days = Array.from({ length: 30 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (29 - i))
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
})

function series(base: number, variance: number, trend = 1): ChartPoint[] {
  return days.map((date, i) => ({
    date,
    value: Math.round(base + i * trend * (base * 0.02) + Math.sin(i / 3) * variance + Math.random() * variance * 0.4),
    secondary: Math.round(base * 0.6 + i * trend * (base * 0.01) + Math.cos(i / 4) * variance * 0.5),
  }))
}

export const tradingVolumeChart = series(1_200_000, 180_000, 1.2)
export const dailyUsersChart = series(420, 80, 1)
export const walletGrowthChart = series(280, 40, 1.5)
export const referralGrowthChart = series(12_000, 2_500, 1.1)
export const revenueChart = series(38_000, 6_000, 1.3)

export const users: User[] = [
  { id: 'usr_8x2k91', name: 'Elena Voss', email: 'elena@arcade.fi', avatar: 'EV', referralCode: 'ELENA2024', status: 'active', walletCount: 4, registeredAt: '2025-11-12T10:22:00Z', referredBy: 'STACK' },
  { id: 'usr_3m9p22', name: 'Marcus Chen', email: 'marcus@nova.xyz', avatar: 'MC', referralCode: 'MCHEN', status: 'active', walletCount: 2, registeredAt: '2025-12-01T14:05:00Z' },
  { id: 'usr_7q1w44', name: 'Sofia Alvarez', email: 'sofia@helix.io', avatar: 'SA', referralCode: 'SOFIA-HX', status: 'active', walletCount: 6, registeredAt: '2026-01-18T09:41:00Z', referredBy: 'ELENA2024' },
  { id: 'usr_2n8r55', name: 'Jonas Berg', email: 'jonas@north.dev', avatar: 'JB', referralCode: 'NORTHJB', status: 'inactive', walletCount: 1, registeredAt: '2026-02-03T16:12:00Z' },
  { id: 'usr_5t4y66', name: 'Aisha Okonkwo', email: 'aisha@pulse.trade', avatar: 'AO', referralCode: 'PULSEAI', status: 'active', walletCount: 3, registeredAt: '2026-02-22T11:30:00Z', referredBy: 'MCHEN' },
  { id: 'usr_9k3l77', name: 'Hiro Tanaka', email: 'hiro@kaito.app', avatar: 'HT', referralCode: 'KAITO', status: 'suspended', walletCount: 2, registeredAt: '2026-03-08T08:15:00Z' },
  { id: 'usr_1p6m88', name: 'Clara Dubois', email: 'clara@lumen.fi', avatar: 'CD', referralCode: 'LUMENCD', status: 'active', walletCount: 5, registeredAt: '2026-03-21T19:44:00Z', referredBy: 'STACK' },
  { id: 'usr_4w2n99', name: 'Ryan Okafor', email: 'ryan@orbit.so', avatar: 'RO', referralCode: 'ORBITR', status: 'active', walletCount: 2, registeredAt: '2026-04-02T13:20:00Z' },
]

export const wallets: Wallet[] = [
  {
    id: 'wal_01',
    address: '0x7a3f…9c2e',
    nickname: 'Main Trading',
    balance: 284500,
    type: 'trading',
    status: 'active',
    userId: 'usr_8x2k91',
    pnl: 42800,
    assets: [
      { symbol: 'ETH', name: 'Ethereum', amount: 42.5, value: 148200, change24h: 2.4 },
      { symbol: 'SOL', name: 'Solana', amount: 890, value: 98200, change24h: -1.2 },
      { symbol: 'USDC', name: 'USD Coin', amount: 38100, value: 38100, change24h: 0 },
    ],
  },
  {
    id: 'wal_02',
    address: '0x2b91…4f8a',
    nickname: 'Cold Reserve',
    balance: 512000,
    type: 'cold',
    status: 'active',
    userId: 'usr_8x2k91',
    pnl: 12400,
    assets: [
      { symbol: 'BTC', name: 'Bitcoin', amount: 4.2, value: 412000, change24h: 1.8 },
      { symbol: 'ETH', name: 'Ethereum', amount: 28.6, value: 100000, change24h: 2.4 },
    ],
  },
  {
    id: 'wal_03',
    address: '0x9e44…1d7c',
    nickname: 'Referral Vault',
    balance: 18420,
    type: 'referral',
    status: 'active',
    userId: 'usr_7q1w44',
    pnl: 3200,
    assets: [{ symbol: 'USDC', name: 'USD Coin', amount: 18420, value: 18420, change24h: 0 }],
  },
  {
    id: 'wal_04',
    address: '0x5c18…8a3b',
    nickname: 'Hot Ops',
    balance: 67400,
    type: 'hot',
    status: 'locked',
    userId: 'usr_3m9p22',
    pnl: -2100,
    assets: [
      { symbol: 'SOL', name: 'Solana', amount: 412, value: 45400, change24h: -1.2 },
      { symbol: 'ETH', name: 'Ethereum', amount: 6.3, value: 22000, change24h: 2.4 },
    ],
  },
  {
    id: 'wal_05',
    address: '0x1f80…6e2d',
    nickname: 'Pulse Desk',
    balance: 129800,
    type: 'trading',
    status: 'active',
    userId: 'usr_5t4y66',
    pnl: 18900,
    assets: [
      { symbol: 'ETH', name: 'Ethereum', amount: 22.1, value: 77200, change24h: 2.4 },
      { symbol: 'ARB', name: 'Arbitrum', amount: 8400, value: 32600, change24h: 4.1 },
      { symbol: 'USDC', name: 'USD Coin', amount: 20000, value: 20000, change24h: 0 },
    ],
  },
]

export const trades: Trade[] = [
  { id: 'tr_901', token: 'Ethereum', tokenSymbol: 'ETH', type: 'buy', amount: 12.4, price: 3482.1, provider: 'Jupiter', slippage: 0.3, pnl: 2140, status: 'filled', time: '2026-07-13T18:42:00Z', wallet: '0x7a3f…9c2e', txHash: '0xabc…f12' },
  { id: 'tr_902', token: 'Solana', tokenSymbol: 'SOL', type: 'sell', amount: 240, price: 148.2, provider: 'Raydium', slippage: 0.5, pnl: -820, status: 'filled', time: '2026-07-13T17:15:00Z', wallet: '0x5c18…8a3b', txHash: '0xdef…a44' },
  { id: 'tr_903', token: 'Arbitrum', tokenSymbol: 'ARB', type: 'buy', amount: 4200, price: 1.12, provider: 'Uniswap', slippage: 0.8, pnl: 640, status: 'partial', time: '2026-07-13T15:08:00Z', wallet: '0x1f80…6e2d', txHash: '0x112…bb9' },
  { id: 'tr_904', token: 'Bitcoin', tokenSymbol: 'BTC', type: 'buy', amount: 0.85, price: 98420, provider: '1inch', slippage: 0.2, pnl: 5100, status: 'filled', time: '2026-07-13T12:30:00Z', wallet: '0x2b91…4f8a', txHash: '0x778…c01' },
  { id: 'tr_905', token: 'Solana', tokenSymbol: 'SOL', type: 'buy', amount: 90, price: 146.8, provider: 'Jupiter', slippage: 0.4, pnl: 0, status: 'pending', time: '2026-07-13T11:02:00Z', wallet: '0x7a3f…9c2e', txHash: '0x991…d22' },
  { id: 'tr_906', token: 'Ethereum', tokenSymbol: 'ETH', type: 'sell', amount: 4.2, price: 3490.5, provider: 'CowSwap', slippage: 0.25, pnl: 1280, status: 'filled', time: '2026-07-12T22:18:00Z', wallet: '0x1f80…6e2d', txHash: '0x334…e55' },
  { id: 'tr_907', token: 'PEPE', tokenSymbol: 'PEPE', type: 'buy', amount: 12_000_000, price: 0.000012, provider: 'Jupiter', slippage: 2.5, pnl: -340, status: 'failed', time: '2026-07-12T19:44:00Z', wallet: '0x5c18…8a3b', txHash: '0x556…f77' },
  { id: 'tr_908', token: 'USDC', tokenSymbol: 'USDC', type: 'buy', amount: 25000, price: 1, provider: 'Circle', slippage: 0.01, pnl: 0, status: 'filled', time: '2026-07-12T16:05:00Z', wallet: '0x9e44…1d7c', txHash: '0x889…a88' },
]

export const positions: Position[] = [
  { id: 'pos_1', token: 'Ethereum', symbol: 'ETH', holdings: 86.4, value: 301400, cost: 268200, pnl: 33200, pnlPercent: 12.4, allocation: 38 },
  { id: 'pos_2', token: 'Solana', symbol: 'SOL', holdings: 1842, value: 203100, cost: 186400, pnl: 16700, pnlPercent: 9.0, allocation: 26 },
  { id: 'pos_3', token: 'Bitcoin', symbol: 'BTC', holdings: 1.85, value: 182000, cost: 168500, pnl: 13500, pnlPercent: 8.0, allocation: 23 },
  { id: 'pos_4', token: 'Arbitrum', symbol: 'ARB', holdings: 12400, value: 48600, cost: 51200, pnl: -2600, pnlPercent: -5.1, allocation: 6 },
  { id: 'pos_5', token: 'USD Coin', symbol: 'USDC', holdings: 54800, value: 54800, cost: 54800, pnl: 0, pnlPercent: 0, allocation: 7 },
]

export const limitOrders: LimitOrder[] = [
  { id: 'lo_1', token: 'Ethereum', symbol: 'ETH', side: 'buy', amount: 5, limitPrice: 3200, currentPrice: 3482, status: 'pending', createdAt: '2026-07-12T10:00:00Z', expiresAt: '2026-07-19T10:00:00Z', wallet: '0x7a3f…9c2e' },
  { id: 'lo_2', token: 'Solana', symbol: 'SOL', side: 'sell', amount: 400, limitPrice: 165, currentPrice: 148.2, status: 'pending', createdAt: '2026-07-11T14:22:00Z', expiresAt: '2026-07-18T14:22:00Z', wallet: '0x1f80…6e2d' },
  { id: 'lo_3', token: 'Bitcoin', symbol: 'BTC', side: 'buy', amount: 0.5, limitPrice: 94000, currentPrice: 98420, status: 'executed', createdAt: '2026-07-08T09:00:00Z', expiresAt: '2026-07-15T09:00:00Z', wallet: '0x2b91…4f8a' },
  { id: 'lo_4', token: 'Arbitrum', symbol: 'ARB', side: 'sell', amount: 8000, limitPrice: 1.35, currentPrice: 1.12, status: 'cancelled', createdAt: '2026-07-05T16:40:00Z', expiresAt: '2026-07-12T16:40:00Z', wallet: '0x5c18…8a3b' },
  { id: 'lo_5', token: 'PEPE', symbol: 'PEPE', side: 'buy', amount: 50_000_000, limitPrice: 0.00001, currentPrice: 0.000012, status: 'failed', createdAt: '2026-07-10T20:11:00Z', expiresAt: '2026-07-17T20:11:00Z', wallet: '0x5c18…8a3b' },
]

export const leaderboard: LeaderboardEntry[] = [
  { rank: 1, token: 'Ethereum', symbol: 'ETH', volume: 12400000, buys: 8421, sells: 6102, holders: 4521, change24h: 4.2 },
  { rank: 2, token: 'Solana', symbol: 'SOL', volume: 9800000, buys: 12041, sells: 9802, holders: 3890, change24h: -1.8 },
  { rank: 3, token: 'Bitcoin', symbol: 'BTC', volume: 8600000, buys: 2104, sells: 1890, holders: 2104, change24h: 2.1 },
  { rank: 4, token: 'Arbitrum', symbol: 'ARB', volume: 2100000, buys: 5402, sells: 4980, holders: 1892, change24h: 6.4 },
  { rank: 5, token: 'Base', symbol: 'BASE', volume: 1450000, buys: 3201, sells: 2980, holders: 1204, change24h: 1.2 },
  { rank: 6, token: 'PEPE', symbol: 'PEPE', volume: 980000, buys: 8901, sells: 9204, holders: 6402, change24h: -8.4 },
]

export const referrals: Referral[] = [
  { id: 'ref_1', userId: 'usr_8x2k91', userName: 'Elena Voss', code: 'ELENA2024', referrals: 48, pendingRewards: 4200, paidRewards: 18600, level: 3, status: 'active' },
  { id: 'ref_2', userId: 'usr_3m9p22', userName: 'Marcus Chen', code: 'MCHEN', referrals: 22, pendingRewards: 980, paidRewards: 6400, level: 2, status: 'active' },
  { id: 'ref_3', userId: 'usr_7q1w44', userName: 'Sofia Alvarez', code: 'SOFIA-HX', referrals: 61, pendingRewards: 8100, paidRewards: 24200, level: 4, status: 'active' },
  { id: 'ref_4', userId: 'usr_1p6m88', userName: 'Clara Dubois', code: 'LUMENCD', referrals: 14, pendingRewards: 420, paidRewards: 2100, level: 1, status: 'active' },
  { id: 'ref_5', userId: 'usr_2n8r55', userName: 'Jonas Berg', code: 'NORTHJB', referrals: 3, pendingRewards: 0, paidRewards: 180, level: 1, status: 'inactive' },
]

export const referralPayments: ReferralPayment[] = [
  { id: 'rp_1', amount: 4200, status: 'paid', wallet: '0x9e44…1d7c', hash: '0xaaa…111', time: '2026-07-12T14:00:00Z', userName: 'Sofia Alvarez' },
  { id: 'rp_2', amount: 1800, status: 'paid', wallet: '0x7a3f…9c2e', hash: '0xbbb…222', time: '2026-07-10T11:22:00Z', userName: 'Elena Voss' },
  { id: 'rp_3', amount: 980, status: 'pending', wallet: '0x5c18…8a3b', hash: '—', time: '2026-07-13T09:00:00Z', userName: 'Marcus Chen' },
  { id: 'rp_4', amount: 640, status: 'paid', wallet: '0x1f80…6e2d', hash: '0xccc…333', time: '2026-07-08T16:40:00Z', userName: 'Aisha Okonkwo' },
  { id: 'rp_5', amount: 2100, status: 'failed', wallet: '0x2b91…4f8a', hash: '0xddd…444', time: '2026-07-07T08:15:00Z', userName: 'Clara Dubois' },
]

export const adminUsers: AdminUser[] = [
  { id: 'adm_1', name: 'Alex Rivera', email: 'alex@stack.admin', avatar: 'AR', role: 'Super Admin', permissions: ['users', 'wallets', 'trades', 'features', 'admins', 'billing'], lastActive: '2026-07-13T18:50:00Z', actionsToday: 42 },
  { id: 'adm_2', name: 'Priya Shah', email: 'priya@stack.admin', avatar: 'PS', role: 'Ops Lead', permissions: ['users', 'wallets', 'trades', 'referrals'], lastActive: '2026-07-13T17:20:00Z', actionsToday: 28 },
  { id: 'adm_3', name: 'Tom Walsh', email: 'tom@stack.admin', avatar: 'TW', role: 'Support', permissions: ['users', 'wallets'], lastActive: '2026-07-13T15:05:00Z', actionsToday: 61 },
  { id: 'adm_4', name: 'Maya Lin', email: 'maya@stack.admin', avatar: 'ML', role: 'Engineer', permissions: ['features', 'bot-storage', 'trades'], lastActive: '2026-07-12T22:40:00Z', actionsToday: 7 },
]

export const featureToggles: FeatureToggle[] = [
  { id: 'ft_1', name: 'Limit Orders', description: 'Enable advanced limit order placement across all trading desks.', enabled: true, updatedBy: 'Maya Lin', updatedAt: '2026-07-10T12:00:00Z', category: 'Trading' },
  { id: 'ft_2', name: 'Referral Payouts', description: 'Automated weekly referral commission disbursements.', enabled: true, updatedBy: 'Alex Rivera', updatedAt: '2026-07-08T09:30:00Z', category: 'Growth' },
  { id: 'ft_3', name: 'Dark Pool Routing', description: 'Route large trades through private liquidity venues.', enabled: false, updatedBy: 'Maya Lin', updatedAt: '2026-07-11T16:20:00Z', category: 'Trading' },
  { id: 'ft_4', name: 'AI Trade Insights', description: 'Surface predictive analytics on the trades overview.', enabled: true, updatedBy: 'Priya Shah', updatedAt: '2026-07-05T11:00:00Z', category: 'Intelligence' },
  { id: 'ft_5', name: 'Multi-Wallet Sync', description: 'Cross-wallet portfolio aggregation and PnL views.', enabled: true, updatedBy: 'Alex Rivera', updatedAt: '2026-06-28T14:45:00Z', category: 'Wallets' },
  { id: 'ft_6', name: 'Beta Leaderboard', description: 'Public token leaderboard with social sharing.', enabled: false, updatedBy: 'Tom Walsh', updatedAt: '2026-07-12T08:10:00Z', category: 'Growth' },
]

export const botStorage: BotStorageItem[] = [
  {
    key: 'trading.strategies.default',
    updatedAt: '2026-07-13T14:22:00Z',
    size: '2.4 KB',
    value: {
      mode: 'aggressive',
      maxSlippage: 0.8,
      rebalanceInterval: '4h',
      pairs: ['ETH/USDC', 'SOL/USDC', 'BTC/USDC'],
      risk: { maxDrawdown: 0.12, positionSize: 0.05 },
    },
  },
  {
    key: 'referral.commission.tiers',
    updatedAt: '2026-07-12T09:00:00Z',
    size: '0.8 KB',
    value: {
      tiers: [
        { level: 1, rate: 0.05 },
        { level: 2, rate: 0.08 },
        { level: 3, rate: 0.12 },
        { level: 4, rate: 0.15 },
      ],
      minPayout: 50,
    },
  },
  {
    key: 'bot.rate_limits',
    updatedAt: '2026-07-11T18:40:00Z',
    size: '0.4 KB',
    value: { requestsPerMinute: 120, burst: 30, cooldownSeconds: 15 },
  },
  {
    key: 'feature.flags.runtime',
    updatedAt: '2026-07-13T08:05:00Z',
    size: '1.1 KB',
    value: {
      darkPool: false,
      aiInsights: true,
      multiWallet: true,
      experiments: { newCheckout: 'B', onboardingV2: true },
    },
  },
]

export const recentActivity: ActivityItem[] = [
  { id: 'act_1', type: 'trade', title: 'Large ETH buy filled', description: '12.4 ETH via Jupiter · $43.2k', time: '2026-07-13T18:42:00Z' },
  { id: 'act_2', type: 'user', title: 'New user registered', description: 'Ryan Okafor joined via organic', time: '2026-07-13T17:10:00Z' },
  { id: 'act_3', type: 'referral', title: 'Referral payout processed', description: '$4,200 sent to Sofia Alvarez', time: '2026-07-13T14:00:00Z' },
  { id: 'act_4', type: 'wallet', title: 'Wallet locked', description: 'Hot Ops (0x5c18…8a3b) flagged by risk', time: '2026-07-13T12:30:00Z' },
  { id: 'act_5', type: 'system', title: 'Feature toggle updated', description: 'Dark Pool Routing disabled by Maya', time: '2026-07-13T11:05:00Z' },
  { id: 'act_6', type: 'trade', title: 'PEPE buy failed', description: 'Slippage exceeded · retry queued', time: '2026-07-12T19:44:00Z' },
]

export const topTokens = [
  { symbol: 'ETH', name: 'Ethereum', volume: 12400000, change: 4.2 },
  { symbol: 'SOL', name: 'Solana', volume: 9800000, change: -1.8 },
  { symbol: 'BTC', name: 'Bitcoin', volume: 8600000, change: 2.1 },
  { symbol: 'ARB', name: 'Arbitrum', volume: 2100000, change: 6.4 },
  { symbol: 'BASE', name: 'Base', volume: 1450000, change: 1.2 },
]
