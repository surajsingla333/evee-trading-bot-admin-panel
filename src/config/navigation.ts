import {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowLeftRight,
  PieChart,
  ListOrdered,
  Trophy,
  Gift,
  Banknote,
  Shield,
  ToggleLeft,
  Database,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface AppNavItem {
  label: string
  href: string
  icon: LucideIcon
  section?: string
}

export const navigation: AppNavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, section: 'Overview' },
  { label: 'Users', href: '/users', icon: Users, section: 'Platform' },
  { label: 'Wallets', href: '/wallets', icon: Wallet },
  { label: 'Trades', href: '/trades', icon: ArrowLeftRight },
  { label: 'Positions', href: '/positions', icon: PieChart },
  { label: 'Limit Orders', href: '/limit-orders', icon: ListOrdered },
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy, section: 'Growth' },
  { label: 'Referrals', href: '/referrals', icon: Gift },
  { label: 'Referral Payments', href: '/referral-payments', icon: Banknote },
  { label: 'Admin Users', href: '/admin-users', icon: Shield, section: 'System' },
  { label: 'Feature Toggles', href: '/feature-toggles', icon: ToggleLeft },
  { label: 'Bot Storage', href: '/bot-storage', icon: Database },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export const breadcrumbLabels: Record<string, string> = {
  '': 'Dashboard',
  users: 'Users',
  wallets: 'Wallets',
  trades: 'Trades',
  positions: 'Positions',
  'limit-orders': 'Limit Orders',
  leaderboard: 'Leaderboard',
  referrals: 'Referrals',
  'referral-payments': 'Referral Payments',
  'admin-users': 'Admin Users',
  'feature-toggles': 'Feature Toggles',
  'bot-storage': 'Bot Storage',
  settings: 'Settings',
}
