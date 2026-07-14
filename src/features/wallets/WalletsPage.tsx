import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Drawer } from '@/components/ui/Drawer'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/Table'
import { wallets as mockWallets } from '@/data/mock'
import type { Wallet } from '@/types'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { BadgeVariant } from '@/types'
import { cn } from '@/lib/cn'

const typeVariant: Record<Wallet['type'], BadgeVariant> = {
  hot: 'warning',
  cold: 'info',
  trading: 'success',
  referral: 'pending',
}

const statusVariant: Record<Wallet['status'], BadgeVariant> = {
  active: 'success',
  inactive: 'neutral',
  locked: 'error',
}

export function WalletsPage() {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [selected, setSelected] = useState<Wallet | null>(null)

  const filtered = mockWallets.filter((w) => {
    const q = search.toLowerCase()
    const match =
      !q ||
      w.address.toLowerCase().includes(q) ||
      w.nickname.toLowerCase().includes(q)
    return match && (!type || w.type === type)
  })

  return (
    <div>
      <PageHeader
        title="Wallets"
        description="Monitor balances, wallet types, and portfolio health across the platform."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          placeholder="Search address or nickname…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          containerClassName="sm:w-72"
        />
        <Select
          placeholder="Wallet type"
          value={type}
          onChange={setType}
          options={[
            { label: 'Hot', value: 'hot' },
            { label: 'Cold', value: 'cold' },
            { label: 'Trading', value: 'trading' },
            { label: 'Referral', value: 'referral' },
          ]}
          className="sm:w-44"
        />
      </div>

      <Table>
        <THead>
          <tr>
            <Th>Wallet Address</Th>
            <Th>Nickname</Th>
            <Th>Balance</Th>
            <Th>Type</Th>
            <Th>Status</Th>
            <Th>PnL</Th>
          </tr>
        </THead>
        <TBody>
          {filtered.map((w) => (
            <Tr key={w.id} onClick={() => setSelected(w)}>
              <Td>
                <code className="font-mono text-xs">{w.address}</code>
              </Td>
              <Td className="font-medium text-slate-900 dark:text-white">{w.nickname}</Td>
              <Td className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(w.balance)}
              </Td>
              <Td>
                <Badge variant={typeVariant[w.type]} className="capitalize">
                  {w.type}
                </Badge>
              </Td>
              <Td>
                <Badge variant={statusVariant[w.status]} dot className="capitalize">
                  {w.status}
                </Badge>
              </Td>
              <Td>
                <span className={cn('font-medium', w.pnl >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                  {formatCurrency(w.pnl)}
                </span>
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.nickname ?? ''}
        description={selected?.address}
      >
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[16px] border border-border dark:border-border-dark p-4">
                <p className="text-xs text-muted">Balance</p>
                <p className="mt-1 text-xl font-semibold">{formatCurrency(selected.balance)}</p>
              </div>
              <div className="rounded-[16px] border border-border dark:border-border-dark p-4">
                <p className="text-xs text-muted">PnL</p>
                <p className={cn('mt-1 text-xl font-semibold', selected.pnl >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                  {formatCurrency(selected.pnl)}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Assets</h3>
              <div className="space-y-2">
                {selected.assets.map((a) => (
                  <div
                    key={a.symbol}
                    className="flex items-center justify-between rounded-[12px] border border-border dark:border-border-dark px-3.5 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{a.symbol}</p>
                      <p className="text-xs text-muted">{a.amount} · {a.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(a.value)}</p>
                      <p className={cn('text-xs', a.change24h >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                        {formatPercent(a.change24h)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[16px] border border-dashed border-border dark:border-border-dark p-6 text-center">
              <p className="text-sm font-medium">Trade History · Portfolio · PnL</p>
              <p className="mt-1 text-xs text-muted">Detailed charts connect via Axios to `/api/wallets/:id`.</p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
