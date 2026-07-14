import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { limitOrders } from '@/data/mock'
import type { LimitOrder } from '@/types'
import type { BadgeVariant } from '@/types'
import { formatCurrency, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'

const statusVariant: Record<LimitOrder['status'], BadgeVariant> = {
  pending: 'pending',
  executed: 'success',
  cancelled: 'neutral',
  failed: 'error',
}

export function LimitOrdersPage() {
  const [status, setStatus] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = limitOrders.filter((o) => !status || o.status === status)

  return (
    <div>
      <PageHeader
        title="Limit Orders"
        description="Manage pending, executed, and cancelled order flow with expandable detail."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {(['', 'pending', 'executed', 'cancelled', 'failed'] as const).map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 capitalize',
              status === s
                ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300'
                : 'border-border dark:border-border-dark text-muted hover:bg-slate-50 dark:hover:bg-slate-800',
            )}
          >
            {s || 'All'}
          </button>
        ))}
        <Select
          placeholder="Filter"
          value={status}
          onChange={setStatus}
          options={[
            { label: 'Pending', value: 'pending' },
            { label: 'Executed', value: 'executed' },
            { label: 'Cancelled', value: 'cancelled' },
            { label: 'Failed', value: 'failed' },
          ]}
          className="ml-auto sm:w-40"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((order) => {
          const open = expanded === order.id
          return (
            <div
              key={order.id}
              className="card-surface overflow-hidden transition-shadow duration-250 hover:shadow-elevated"
            >
              <button
                type="button"
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
                onClick={() => setExpanded(open ? null : order.id)}
              >
                <div className="min-w-0 flex-1 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 items-center">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{order.symbol}</p>
                    <p className="text-xs text-muted">{order.token}</p>
                  </div>
                  <div>
                    <Badge variant={order.side === 'buy' ? 'success' : 'info'} className="capitalize">
                      {order.side}
                    </Badge>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted">Amount</p>
                    <p className="text-sm font-medium">{order.amount.toLocaleString()}</p>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs text-muted">Limit</p>
                    <p className="text-sm font-medium">{formatCurrency(order.limitPrice)}</p>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs text-muted">Market</p>
                    <p className="text-sm font-medium">{formatCurrency(order.currentPrice)}</p>
                  </div>
                  <div>
                    <Badge variant={statusVariant[order.status]} dot className="capitalize">
                      {order.status}
                    </Badge>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-slate-400 transition-transform duration-250',
                    open && 'rotate-180',
                  )}
                />
              </button>
              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border dark:border-border-dark bg-surface/50 dark:bg-slate-900/40 px-5 py-4 grid sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted">Wallet</p>
                        <p className="mt-1 font-mono text-xs">{order.wallet}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Created</p>
                        <p className="mt-1">{formatRelativeTime(order.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Expires</p>
                        <p className="mt-1">{formatRelativeTime(order.expiresAt)}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
