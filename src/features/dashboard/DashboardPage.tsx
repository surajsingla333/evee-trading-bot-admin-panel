import { useEffect, useState } from 'react'
import { ArrowRight, Activity, Zap, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AreaTrendChart } from '@/components/charts/AreaTrendChart'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'
import { StatCard } from '@/components/ui/StatCard'
import { appEnv, useMockData } from '@/config/env'
import { getDashboardData } from '@/services/dashboard'
import type { DashboardData } from '@/types/dashboard'
import { formatCompact, formatCurrency, formatPercent, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'

const activityIcon: Record<string, string> = {
  trade: 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400',
  user: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  wallet: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  referral: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  system: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center rounded-[12px] border border-dashed border-border dark:border-border-dark text-sm text-muted">
      No {label} series from API yet
    </div>
  )
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const next = await getDashboardData()
        if (!cancelled) setData(next)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard')
          setData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-9 w-72 mb-2" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="card-surface p-8 max-w-xl">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Dashboard unavailable</h1>
        <p className="mt-2 text-sm text-muted">{error || 'Unknown error'}</p>
        <Button className="mt-5" onClick={() => setReloadKey((k) => k + 1)}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  const hasCharts = data.tradingVolumeChart.length > 0

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">Overview</p>
          <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">
            Welcome back, Admin
          </h1>
          <p className="mt-2 text-sm text-muted max-w-lg">
            Platform health, trading flow, and growth signals — refined for decisive ops.
            <span className="ml-2 inline-flex items-center rounded-full border border-border dark:border-border-dark px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300">
              {appEnv}
              {useMockData ? ' · mock' : ' · live'}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Link
            to="/trades"
            className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-border dark:border-border-dark bg-white dark:bg-slate-800 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-750"
          >
            View trades <ArrowRight className="h-4 w-4" />
          </Link>
          <Button>
            <Zap className="h-4 w-4" />
            Generate report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        {data.kpiStats.map((stat, i) => (
          <StatCard key={stat.id} stat={stat} index={i} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3 mb-6">
        <Card className="xl:col-span-2">
          <CardHeader title="Trading Volume" description="Last 30 days · platform-wide" />
          {hasCharts ? (
            <AreaTrendChart data={data.tradingVolumeChart} format="currency" height={280} />
          ) : (
            <EmptyChart label="trading volume" />
          )}
        </Card>
        <Card>
          <CardHeader title="Daily Users" description="Active unique wallets" />
          {hasCharts ? (
            <AreaTrendChart data={data.dailyUsersChart} color="#3B82F6" height={280} />
          ) : (
            <EmptyChart label="daily users" />
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader title="Wallet Growth" description="New wallets / day" />
          {hasCharts ? (
            <AreaTrendChart data={data.walletGrowthChart} color="#60A5FA" height={200} />
          ) : (
            <EmptyChart label="wallet growth" />
          )}
        </Card>
        <Card>
          <CardHeader title="Referral Growth" description="Commission accrued" />
          {hasCharts ? (
            <AreaTrendChart
              data={data.referralGrowthChart}
              format="currency"
              color="#2563EB"
              height={200}
            />
          ) : (
            <EmptyChart label="referral growth" />
          )}
        </Card>
        <Card>
          <CardHeader title="Revenue Analytics" description="Platform fees" />
          {hasCharts ? (
            <AreaTrendChart data={data.revenueChart} format="currency" color="#1D4ED8" height={200} />
          ) : (
            <EmptyChart label="revenue" />
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader
            title="Recent Activity"
            action={
              <Button variant="ghost" size="sm">
                <Activity className="h-3.5 w-3.5" /> All
              </Button>
            }
          />
          {data.recentActivity.length === 0 ? (
            <p className="px-1 py-6 text-sm text-muted">No recent activity yet.</p>
          ) : (
            <ul className="space-y-1">
              {data.recentActivity.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-[12px] p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold',
                      activityIcon[item.type],
                    )}
                  >
                    {item.type[0].toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <span className="text-[11px] text-muted shrink-0">
                        {formatRelativeTime(item.time)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted truncate">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader
            title="Latest Trades"
            action={
              <Link to="/trades" className="text-xs font-medium text-primary-600 hover:text-primary-700">
                View all
              </Link>
            }
          />
          {data.trades.length === 0 ? (
            <p className="px-1 py-6 text-sm text-muted">No trades returned from the API.</p>
          ) : (
            <div className="space-y-2">
              {data.trades.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-[12px] border border-border dark:border-border-dark px-3 py-2.5"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {t.tokenSymbol}
                      </span>
                      <Badge variant={t.type === 'buy' ? 'success' : 'info'} className="capitalize">
                        {t.type}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {t.amount} · {t.provider}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        t.pnl >= 0 ? 'text-emerald-600' : 'text-red-500',
                      )}
                    >
                      {t.pnl === 0 ? '—' : formatCurrency(t.pnl)}
                    </p>
                    <p className="text-[11px] text-muted">{formatRelativeTime(t.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Top Tokens" description="By volume (SOL)" />
          {data.topTokens.length === 0 ? (
            <p className="px-1 py-6 text-sm text-muted">No leaderboard tokens yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topTokens.map((token, i) => (
                <div key={token.symbol} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-500/10 text-xs font-bold text-primary-700 dark:text-primary-300">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{token.symbol}</p>
                    <p className="text-xs text-muted">{token.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {formatCompact(token.volume)} SOL
                    </p>
                    {token.change !== 0 && (
                      <p
                        className={cn(
                          'text-xs font-medium',
                          token.change >= 0 ? 'text-emerald-600' : 'text-red-500',
                        )}
                      >
                        {formatPercent(token.change)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-border dark:border-border-dark">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/users', label: 'Users' },
                { to: '/wallets', label: 'Wallets' },
                { to: '/feature-toggles', label: 'Features' },
                { to: '/referrals', label: 'Referrals' },
              ].map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  className="rounded-[12px] border border-border dark:border-border-dark px-3 py-2.5 text-center text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-primary-200 hover:bg-primary-50/50 dark:hover:bg-primary-500/5 transition-all duration-200"
                >
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
