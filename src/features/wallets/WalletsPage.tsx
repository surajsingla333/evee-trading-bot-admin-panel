import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Table, THead, Th, TBody, Tr, Td, TablePagination } from '@/components/ui/Table'
import { getWallets, type WalletRow, type WalletsResult } from '@/services/wallets'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { BadgeVariant } from '@/types'
import { cn } from '@/lib/cn'

const statusVariant: Record<WalletRow['status'], BadgeVariant> = {
  active: 'success',
  inactive: 'neutral',
}

function explorerUrl(w: WalletRow) {
  if (!w.address) return null
  return w.chain === 'robinhood'
    ? `https://robinhoodchain.blockscout.com/address/${w.address}`
    : `https://solscan.io/account/${w.address}`
}

function shortAddress(address: string) {
  if (address.length <= 14) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function WalletsPage() {
  const [data, setData] = useState<WalletsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('')
  const [chain, setChain] = useState<'' | 'solana' | 'robinhood'>('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [selected, setSelected] = useState<WalletRow | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const timer = setTimeout(async () => {
      try {
        const result = await getWallets({
          page,
          search: search.trim() || undefined,
          status,
          chain,
        })
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load wallets')
          setData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, search ? 350 : 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [page, search, status, chain, reloadKey])

  return (
    <div>
      <PageHeader
        title="Wallets"
        description="Bot wallets across Solana and Robinhood — balances, PnL, and assets."
        actions={
          <Button variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <SearchInput
          placeholder="Address, nickname, or user ID…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          containerClassName="lg:w-80"
        />
        <Select
          placeholder="Status"
          value={status}
          onChange={(v) => {
            setStatus(v as '' | 'active' | 'inactive')
            setPage(1)
          }}
          options={[
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ]}
          className="lg:w-40"
        />
        <Select
          placeholder="Chain"
          value={chain}
          onChange={(v) => {
            setChain(v as '' | 'solana' | 'robinhood')
            setPage(1)
          }}
          options={[
            { label: 'Solana', value: 'solana' },
            { label: 'Robinhood', value: 'robinhood' },
          ]}
          className="lg:w-40"
        />
        {data && (
          <p className="text-sm text-muted">
            {data.total} wallet{data.total === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {loading ? (
        <SkeletonTable rows={8} />
      ) : error ? (
        <div className="card-surface p-8 max-w-xl">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            Failed to load wallets
          </p>
          <p className="mt-1 text-sm text-muted">{error}</p>
          <Button className="mt-4" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="card-surface p-10 text-center">
          <p className="text-sm font-medium text-slate-900 dark:text-white">No wallets found</p>
          <p className="mt-1 text-sm text-muted">
            {search || status || chain ? 'Try different filters.' : 'The API returned no wallets.'}
          </p>
        </div>
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <Th>Address</Th>
                <Th>Nickname</Th>
                <Th>User</Th>
                <Th>Chain</Th>
                <Th>Balance</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th>PnL</Th>
              </tr>
            </THead>
            <TBody>
              {data.items.map((w) => (
                <Tr key={w.id} onClick={() => setSelected(w)}>
                  <Td>
                    <code className="font-mono text-xs" title={w.address}>
                      {shortAddress(w.address) || '—'}
                    </code>
                  </Td>
                  <Td className="font-medium text-slate-900 dark:text-white">
                    {w.nickname || '—'}
                  </Td>
                  <Td>
                    <span className="text-xs font-mono text-muted">{w.userId || '—'}</span>
                  </Td>
                  <Td>
                    <Badge
                      variant={w.chain === 'solana' ? 'info' : 'warning'}
                      className="capitalize"
                    >
                      {w.chain}
                    </Badge>
                  </Td>
                  <Td className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(w.balance)}
                  </Td>
                  <Td>
                    <Badge variant="success" className="capitalize">
                      {w.type}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge variant={statusVariant[w.status]} dot className="capitalize">
                      {w.status}
                    </Badge>
                  </Td>
                  <Td>
                    <span
                      className={cn(
                        'font-medium',
                        w.pnl >= 0 ? 'text-emerald-600' : 'text-red-500',
                      )}
                    >
                      {formatCurrency(w.pnl)}
                    </span>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          <div className="card-surface mt-0 rounded-t-none border-t-0">
            <TablePagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.nickname || selected?.address?.slice(0, 12) || 'Wallet'}
        description={selected?.address}
        width="max-w-xl"
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selected.chain === 'solana' ? 'info' : 'warning'}
                className="capitalize"
              >
                {selected.chain}
              </Badge>
              <Badge variant="success" className="capitalize">
                {selected.type}
              </Badge>
              <Badge variant={statusVariant[selected.status]} dot className="capitalize">
                {selected.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[16px] border border-border dark:border-border-dark p-4">
                <p className="text-xs text-muted">Balance (USD)</p>
                <p className="mt-1 text-xl font-semibold">{formatCurrency(selected.balance)}</p>
              </div>
              <div className="rounded-[16px] border border-border dark:border-border-dark p-4">
                <p className="text-xs text-muted">PnL (USD)</p>
                <p
                  className={cn(
                    'mt-1 text-xl font-semibold',
                    selected.pnl >= 0 ? 'text-emerald-600' : 'text-red-500',
                  )}
                >
                  {formatCurrency(selected.pnl)}
                </p>
              </div>
            </div>

            <dl className="space-y-3">
              {[
                ['User ID', selected.userId || '—'],
                ['Address', selected.address || '—'],
                ['Type', selected.type],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-4 border-b border-border dark:border-border-dark pb-3"
                >
                  <dt className="text-sm text-muted">{k}</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white break-all text-right font-mono">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>

            {explorerUrl(selected) && (
              <a
                href={explorerUrl(selected)!}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View on {selected.chain === 'robinhood' ? 'Robinhood Explorer' : 'Solscan'} →
              </a>
            )}

            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Assets</h3>
              {selected.assets.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">No assets for this wallet.</p>
              ) : (
                <div className="space-y-2">
                  {selected.assets.map((a, i) => (
                    <div
                      key={`${a.symbol}-${i}`}
                      className="flex items-center justify-between rounded-[12px] border border-border dark:border-border-dark px-3.5 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold">{a.symbol}</p>
                        <p className="text-xs text-muted">
                          {a.amount} · {a.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(a.value)}</p>
                        <p
                          className={cn(
                            'text-xs',
                            a.change24h >= 0 ? 'text-emerald-600' : 'text-red-500',
                          )}
                        >
                          {formatPercent(a.change24h)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
