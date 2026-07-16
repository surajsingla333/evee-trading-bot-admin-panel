import {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowLeftRight,
  Trophy,
  Gift,
  Banknote,
  ToggleLeft,
  Database,
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
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy, section: 'Growth' },
  { label: 'Referrals', href: '/referrals', icon: Gift },
  { label: 'Referral Payments', href: '/referral-payments', icon: Banknote },
  { label: 'Feature Toggles', href: '/feature-toggles', icon: ToggleLeft, section: 'System' },
  { label: 'Bot Storage', href: '/bot-storage', icon: Database },
]

export const breadcrumbLabels: Record<string, string> = {
  '': 'Dashboard',
  users: 'Users',
  wallets: 'Wallets',
  trades: 'Trades',
  leaderboard: 'Leaderboard',
  referrals: 'Referrals',
  'referral-payments': 'Referral Payments',
  'feature-toggles': 'Feature Toggles',
  'bot-storage': 'Bot Storage',
}
