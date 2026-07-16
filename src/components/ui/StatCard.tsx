import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { formatCompact, formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { KpiStat } from '@/types'

export function StatCard({
  stat,
  index = 0,
}: {
  stat: KpiStat
  index?: number
}) {
  const animated = useCountUp(stat.value, 1000)
  const display =
    stat.format === 'currency'
      ? formatCurrency(animated)
      : stat.format === 'compact'
        ? formatCompact(animated)
        : formatNumber(Math.round(animated))

  const positive = (stat.change ?? 0) >= 0

  const breakdownParts: string[] = []
  if (stat.breakdown) {
    const b = stat.breakdown
    if (typeof b.solanaWallets === 'number') breakdownParts.push(`${b.solanaWallets} Solana`)
    if (typeof b.robinhoodWallets === 'number') breakdownParts.push(`${b.robinhoodWallets} Robinhood`)
    if (typeof b.solanaVolumeSol === 'number') breakdownParts.push(`${b.solanaVolumeSol} SOL`)
    if (typeof b.robinhoodVolumeEth === 'number') breakdownParts.push(`${b.robinhoodVolumeEth} ETH`)
    if (typeof b.amountSol === 'number') breakdownParts.push(`${b.amountSol} SOL`)
    if (typeof b.solPriceUsd === 'number') breakdownParts.push(`SOL $${b.solPriceUsd}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
      className="card-surface p-5 hover-elevate group"
    >
      <p className="text-[13px] font-medium text-muted tracking-wide">{stat.label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-[28px] font-semibold tracking-tight text-slate-900 dark:text-white leading-none">
          {stat.prefix}
          {display}
          {stat.suffix}
        </p>
        {stat.change != null && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium',
              positive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
            )}
          >
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {formatPercent(stat.change)}
          </span>
        )}
      </div>
      {breakdownParts.length > 0 && (
        <p className="mt-2 text-[11px] text-muted truncate" title={breakdownParts.join(' · ')}>
          {breakdownParts.join(' · ')}
        </p>
      )}
    </motion.div>
  )
}
