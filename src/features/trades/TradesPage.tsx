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
import { getTrades, type NormalizedTrade, type TradesResult } from '@/services/trades'
import type { BadgeVariant } from '@/types'
import { formatCurrency, formatRelativeTime } from '@/lib/format'

const statusVariant: Record<NormalizedTrade['status'], BadgeVariant> = {
  completed: 'success',
  pending: 'pending',
  failed: 'error',
}

function txExplorerUrl(t: NormalizedTrade) {
  if (!t.txHash) return null
  return t.chain === 'robinhood'
    ? `https://robinhoodchain.blockscout.com/tx/${t.txHash}`
    : `https://solscan.io/tx/${t.txHash}`
}

export function TradesPage() {
  const [data, setData] = useState<TradesResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [type, setType] = useState<'' | 'buy' | 'sell'>('')
  const [status, setStatus] = useState<'' | 'pending' | 'completed' | 'failed'>('')
  const [chain, setChain] = useState<'' | 'solana' | 'robinhood'>('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [selected, setSelected] = useState<NormalizedTrade | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const timer = setTimeout(async () => {
      try {
        const result = await getTrades({
          page,
          type,
          status,
          chain,
          tokenAddress: search.trim() || undefined,
        })
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load trades')
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
  }, [page, search, type, status, chain, reloadKey])

  return (
    <div>
      <PageHeader
        title="Trades"
        description="All platform trades across Solana and Robinhood."
        actions={
          <Button variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <SearchInput
          placeholder="Token address…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          containerClassName="lg:w-72"
        />
        <Select
          placeholder="Type"
          value={type}
          onChange={(v) => {
            setType(v as '' | 'buy' | 'sell')
            setPage(1)
          }}
          options={[
            { label: 'Buy', value: 'buy' },
            { label: 'Sell', value: 'sell' },
          ]}
          className="lg:w-36"
        />
        <Select
          placeholder="Status"
          value={status}
          onChange={(v) => {
            setStatus(v as '' | 'pending' | 'completed' | 'failed')
            setPage(1)
          }}
          options={[
            { label: 'Completed', value: 'completed' },
            { label: 'Pending', value: 'pending' },
            { label: 'Failed', value: 'failed' },
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
            {data.total} trade{data.total === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {loading ? (
        <SkeletonTable rows={8} />
      ) : error ? (
        <div className="card-surface p-8 max-w-xl">
          <p className="text-sm font-medium text-slate-900 dark:text-white">Failed to load trades</p>
          <p className="mt-1 text-sm text-muted">{error}</p>
          <Button className="mt-4" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="card-surface p-10 text-center">
          <p className="text-sm font-medium text-slate-900 dark:text-white">No trades found</p>
          <p className="mt-1 text-sm text-muted">
            {search || type || status || chain
              ? 'Try different filters.'
              : 'The API returned no trades.'}
          </p>
        </div>
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <Th>Token</Th>
                <Th>Chain</Th>
                <Th>Type</Th>
                <Th>Native Amount</Th>
               
                <Th>Status</Th>
                <Th>Provider</Th>
                <Th>Tx</Th>
                <Th>Time</Th>
              </tr>
            </THead>
            <TBody>
              {data.items.map((t) => {
                const explorer = txExplorerUrl(t)
                return (
                  <Tr key={t.id} onClick={() => setSelected(t)}>
                    <Td>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {t.tokenSymbol || t.tokenAddress.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted">
                          {t.tokenName || t.tokenAddress.slice(0, 12)}
                        </p>
                      </div>
                    </Td>
                    <Td>
                      <Badge
                        variant={t.chain === 'solana' ? 'info' : 'warning'}
                        className="capitalize"
                      >
                        {t.chain}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge
                        variant={t.type === 'buy' ? 'success' : 'info'}
                        className="capitalize"
                      >
                        {t.type}
                      </Badge>
                    </Td>
                    <Td>
                      {t.nativeAmount} {t.nativeUnit}
                    </Td>
                    
                    <Td>
                      <Badge variant={statusVariant[t.status]} dot className="capitalize">
                        {t.status}
                      </Badge>
                    </Td>
                    <Td className="capitalize">{t.provider || '—'}</Td>
                    <Td>
                      {explorer ? (
                        <a
                          href={explorer}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs text-primary-600 hover:text-primary-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t.txHash!.slice(0, 10)}…
                        </a>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td>{t.timestamp ? formatRelativeTime(t.timestamp) : '—'}</Td>
                  </Tr>
                )
              })}
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
        title={
          selected
            ? `${selected.tokenSymbol || selected.tokenAddress.slice(0, 8)} · ${selected.type}`
            : ''
        }
        description={selected?.id}
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
              <Badge
                variant={selected.type === 'buy' ? 'success' : 'info'}
                className="capitalize"
              >
                {selected.type}
              </Badge>
              <Badge variant={statusVariant[selected.status]} dot className="capitalize">
                {selected.status}
              </Badge>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              {[
                ['Token', selected.tokenName || selected.tokenSymbol || '—'],
                ['Token Address', selected.tokenAddress || '—'],
                ['Native Amount', `${selected.nativeAmount} ${selected.nativeUnit}`],
                ['Token Amount', selected.amount != null ? String(selected.amount) : '—'],
                [
                  'Price (USD)',
                  selected.priceUsd != null ? formatCurrency(selected.priceUsd) : '—',
                ],
                [
                  'PnL',
                  selected.pnl != null
                    ? `${formatCurrency(selected.pnl)}${
                        selected.pnlPercentage != null ? ` (${selected.pnlPercentage}%)` : ''
                      }`
                    : '—',
                ],
                ['Provider', selected.provider || '—'],
                [
                  'Time',
                  selected.timestamp ? new Date(selected.timestamp).toLocaleString() : '—',
                ],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-[14px] border border-border dark:border-border-dark p-3.5"
                >
                  <dt className="text-[11px] uppercase tracking-wider text-muted">{k}</dt>
                  <dd className="mt-1 text-sm font-medium break-all text-slate-900 dark:text-white">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>

            {selected.txHash && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Transaction
                </p>
                <a
                  href={txExplorerUrl(selected) ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block rounded-[14px] border border-border dark:border-border-dark px-4 py-3 font-mono text-xs text-primary-600 hover:text-primary-700 break-all"
                >
                  {selected.txHash}
                </a>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
