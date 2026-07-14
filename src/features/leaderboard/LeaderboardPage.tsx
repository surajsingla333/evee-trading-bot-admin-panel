import { motion } from 'framer-motion'
import { PageHeader } from '@/components/ui/PageHeader'
import { leaderboard } from '@/data/mock'
import { formatCompact, formatPercent } from '@/lib/format'
import { cn } from '@/lib/cn'

export function LeaderboardPage() {
  return (
    <div>
      <PageHeader
        title="Leaderboard"
        description="Token rankings by volume, flow, and holder depth."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-8">
        {leaderboard.slice(0, 3).map((entry, i) => (
          <motion.div
            key={entry.symbol}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className={cn(
              'card-surface p-6 relative overflow-hidden hover-elevate',
              i === 0 && 'ring-1 ring-primary-200 dark:ring-primary-500/30',
            )}
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-50 dark:bg-primary-500/10" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Rank #{entry.rank}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  {entry.symbol}
                </p>
                <p className="text-sm text-muted">{entry.token}</p>
              </div>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium',
                  entry.change24h >= 0
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
                )}
              >
                {formatPercent(entry.change24h)}
              </span>
            </div>
            <dl className="relative mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted">Volume</dt>
                <dd className="mt-0.5 font-semibold">{formatCompact(entry.volume)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Holders</dt>
                <dd className="mt-0.5 font-semibold">{formatCompact(entry.holders)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Buys</dt>
                <dd className="mt-0.5 font-semibold">{formatCompact(entry.buys)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Sells</dt>
                <dd className="mt-0.5 font-semibold">{formatCompact(entry.sells)}</dd>
              </div>
            </dl>
          </motion.div>
        ))}
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border dark:border-border-dark bg-surface/80 dark:bg-slate-900/50">
              <tr>
                {['Rank', 'Token', 'Volume', 'Buys', 'Sells', 'Holders', '24h'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border-dark">
              {leaderboard.map((e) => (
                <tr
                  key={e.symbol}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-5 py-4">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-xs font-bold text-primary-700 dark:text-primary-300">
                      {e.rank}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900 dark:text-white">{e.symbol}</p>
                    <p className="text-xs text-muted">{e.token}</p>
                  </td>
                  <td className="px-5 py-4 font-medium">{formatCompact(e.volume)}</td>
                  <td className="px-5 py-4">{formatCompact(e.buys)}</td>
                  <td className="px-5 py-4">{formatCompact(e.sells)}</td>
                  <td className="px-5 py-4">{formatCompact(e.holders)}</td>
                  <td className="px-5 py-4">
                    <span className={e.change24h >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                      {formatPercent(e.change24h)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
