import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Drawer } from '@/components/ui/Drawer'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/Table'
import { AreaTrendChart } from '@/components/charts/AreaTrendChart'
import { trades as mockTrades, tradingVolumeChart } from '@/data/mock'
import type { Trade } from '@/types'
import type { BadgeVariant } from '@/types'
import { formatCurrency, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'

const statusVariant: Record<Trade['status'], BadgeVariant> = {
  filled: 'success',
  partial: 'warning',
  failed: 'error',
  pending: 'pending',
}

export function TradesPage() {
  const [search, setSearch] = useState('')
  const [provider, setProvider] = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<Trade | null>(null)

  const filtered = useMemo(() => {
    return mockTrades.filter((t) => {
      const q = search.toLowerCase()
      const match =
        !q ||
        t.token.toLowerCase().includes(q) ||
        t.tokenSymbol.toLowerCase().includes(q) ||
        t.wallet.toLowerCase().includes(q)
      return match && (!provider || t.provider === provider) && (!status || t.status === status)
    })
  }, [search, provider, status])

  return (
    <div>
      <PageHeader
        title="Trades"
        description="Professional trade blotter with provider routing, slippage, and PnL."
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:flex-wrap">
        <SearchInput
          placeholder="Token or wallet…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          containerClassName="lg:w-64"
        />
        <Select
          placeholder="Provider"
          value={provider}
          onChange={setProvider}
          options={[...new Set(mockTrades.map((t) => t.provider))].map((p) => ({
            label: p,
            value: p,
          }))}
          className="lg:w-40"
        />
        <Select
          placeholder="Status"
          value={status}
          onChange={setStatus}
          options={[
            { label: 'Filled', value: 'filled' },
            { label: 'Partial', value: 'partial' },
            { label: 'Pending', value: 'pending' },
            { label: 'Failed', value: 'failed' },
          ]}
          className="lg:w-36"
        />
        <input
          type="date"
          className="h-10 rounded-[12px] border border-border dark:border-border-dark bg-white dark:bg-slate-900/50 px-3.5 text-sm focus-ring lg:w-44"
        />
      </div>

      <Table>
        <THead>
          <tr>
            <Th>Token</Th>
            <Th>Type</Th>
            <Th>Amount</Th>
            <Th>Price</Th>
            <Th>Provider</Th>
            <Th>Slippage</Th>
            <Th>PnL</Th>
            <Th>Status</Th>
            <Th>Time</Th>
          </tr>
        </THead>
        <TBody>
          {filtered.map((t) => (
            <Tr key={t.id} onClick={() => setSelected(t)}>
              <Td>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{t.tokenSymbol}</p>
                  <p className="text-xs text-muted">{t.token}</p>
                </div>
              </Td>
              <Td>
                <Badge variant={t.type === 'buy' ? 'success' : 'info'} className="capitalize">
                  {t.type}
                </Badge>
              </Td>
              <Td>{t.amount.toLocaleString()}</Td>
              <Td>{formatCurrency(t.price)}</Td>
              <Td>{t.provider}</Td>
              <Td>{t.slippage}%</Td>
              <Td>
                <span className={cn('font-medium', t.pnl > 0 ? 'text-emerald-600' : t.pnl < 0 ? 'text-red-500' : 'text-muted')}>
                  {t.pnl === 0 ? '—' : formatCurrency(t.pnl)}
                </span>
              </Td>
              <Td>
                <Badge variant={statusVariant[t.status]} dot className="capitalize">
                  {t.status}
                </Badge>
              </Td>
              <Td>{formatRelativeTime(t.time)}</Td>
            </Tr>
          ))}
        </TBody>
      </Table>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`${selected?.tokenSymbol ?? ''} Trade`}
        description={selected?.id}
        width="max-w-xl"
      >
        {selected && (
          <div className="space-y-6">
            <dl className="grid grid-cols-2 gap-4">
              {[
                ['Tx Hash', selected.txHash],
                ['Wallet', selected.wallet],
                ['Provider', selected.provider],
                ['Slippage', `${selected.slippage}%`],
                ['Amount', selected.amount.toLocaleString()],
                ['Price', formatCurrency(selected.price)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-[14px] border border-border dark:border-border-dark p-3.5">
                  <dt className="text-[11px] uppercase tracking-wider text-muted">{k}</dt>
                  <dd className="mt-1 text-sm font-medium font-mono break-all text-slate-900 dark:text-white">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            <div>
              <h3 className="text-sm font-semibold mb-3">Price context</h3>
              <AreaTrendChart data={tradingVolumeChart.slice(-14)} height={180} />
            </div>
            <pre className="rounded-[14px] bg-slate-950 text-slate-300 p-4 text-xs overflow-x-auto">
{JSON.stringify(
  {
    id: selected.id,
    token: selected.tokenSymbol,
    type: selected.type,
    metadata: { provider: selected.provider, wallet: selected.wallet },
  },
  null,
  2,
)}
            </pre>
          </div>
        )}
      </Drawer>
    </div>
  )
}
