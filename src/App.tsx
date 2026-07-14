import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { ThemeProvider } from '@/hooks/useTheme'
import { SidebarProvider } from '@/hooks/useSidebar'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SkeletonCard } from '@/components/ui/Skeleton'

const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const UsersPage = lazy(() =>
  import('@/features/users/UsersPage').then((m) => ({ default: m.UsersPage })),
)
const WalletsPage = lazy(() =>
  import('@/features/wallets/WalletsPage').then((m) => ({ default: m.WalletsPage })),
)
const TradesPage = lazy(() =>
  import('@/features/trades/TradesPage').then((m) => ({ default: m.TradesPage })),
)
const PositionsPage = lazy(() =>
  import('@/features/positions/PositionsPage').then((m) => ({ default: m.PositionsPage })),
)
const LimitOrdersPage = lazy(() =>
  import('@/features/limit-orders/LimitOrdersPage').then((m) => ({ default: m.LimitOrdersPage })),
)
const LeaderboardPage = lazy(() =>
  import('@/features/leaderboard/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })),
)
const ReferralsPage = lazy(() =>
  import('@/features/referrals/ReferralsPage').then((m) => ({ default: m.ReferralsPage })),
)
const ReferralPaymentsPage = lazy(() =>
  import('@/features/referral-payments/ReferralPaymentsPage').then((m) => ({
    default: m.ReferralPaymentsPage,
  })),
)
const AdminUsersPage = lazy(() =>
  import('@/features/admin-users/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
)
const FeatureTogglesPage = lazy(() =>
  import('@/features/feature-toggles/FeatureTogglesPage').then((m) => ({
    default: m.FeatureTogglesPage,
  })),
)
const BotStoragePage = lazy(() =>
  import('@/features/bot-storage/BotStoragePage').then((m) => ({ default: m.BotStoragePage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)

function PageLoader() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="wallets" element={<WalletsPage />} />
                <Route path="trades" element={<TradesPage />} />
                <Route path="positions" element={<PositionsPage />} />
                <Route path="limit-orders" element={<LimitOrdersPage />} />
                <Route path="leaderboard" element={<LeaderboardPage />} />
                <Route path="referrals" element={<ReferralsPage />} />
                <Route path="referral-payments" element={<ReferralPaymentsPage />} />
                <Route path="admin-users" element={<AdminUsersPage />} />
                <Route path="feature-toggles" element={<FeatureTogglesPage />} />
                <Route path="bot-storage" element={<BotStoragePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SidebarProvider>
    </ThemeProvider>
  )
}
