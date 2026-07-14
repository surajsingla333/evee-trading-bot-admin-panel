import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { DonutChart } from '@/components/charts/DonutChart'
import { positions } from '@/data/mock'
import { formatCurrency, formatPercent } from '@/lib/format'
import { cn } from '@/lib/cn'

export function PositionsPage() {
  const totalValue = positions.reduce((s, p) => s + p.value, 0)
  const totalPnl = positions.reduce((s, p) => s + p.pnl, 0)
  const totalCost = positions.reduce((s, p) => s + p.cost, 0)
  const donutData = positions.map((p) => ({ name: p.symbol, value: p.allocation }))

  return (
    <div>
      <PageHeader
        title="Positions"
        description="Portfolio-style overview of holdings, allocation, and unrealized PnL."
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {[
          { label: 'Current Holdings', value: formatCurrency(totalValue) },
          {
            label: 'Unrealized PnL',
            value: formatCurrency(totalPnl),
            tone: totalPnl >= 0 ? 'pos' : 'neg',
          },
          { label: 'Cost Basis', value: formatCurrency(totalCost) },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-[13px] font-medium text-muted">{s.label}</p>
            <p
              className={cn(
                'mt-2 text-2xl font-semibold tracking-tight',
                s.tone === 'pos' && 'text-emerald-600',
                s.tone === 'neg' && 'text-red-500',
                !s.tone && 'text-slate-900 dark:text-white',
              )}
            >
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Token Allocation" description="By portfolio weight" />
          <DonutChart data={donutData} height={240} />
          <div className="mt-2 space-y-2">
            {positions.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'][i] }}
                  />
                  <span className="font-medium">{p.symbol}</span>
                </div>
                <span className="text-muted">{p.allocation}%</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-3 grid gap-4 sm:grid-cols-2">
          {positions.map((p) => (
            <Card key={p.id} hover className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{p.symbol}</p>
                  <p className="text-xs text-muted">{p.token}</p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-medium',
                    p.pnlPercent > 0
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : p.pnlPercent < 0
                        ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                        : 'bg-slate-50 text-slate-600',
                  )}
                >
                  {formatPercent(p.pnlPercent)}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">Holdings</dt>
                  <dd className="mt-0.5 font-medium">{p.holdings.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Value</dt>
                  <dd className="mt-0.5 font-medium">{formatCurrency(p.value)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Profit / Loss</dt>
                  <dd
                    className={cn(
                      'mt-0.5 font-semibold',
                      p.pnl > 0 ? 'text-emerald-600' : p.pnl < 0 ? 'text-red-500' : '',
                    )}
                  >
                    {formatCurrency(p.pnl)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Allocation</dt>
                  <dd className="mt-0.5 font-medium">{p.allocation}%</dd>
                </div>
              </dl>
              <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-600"
                  style={{ width: `${p.allocation}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
