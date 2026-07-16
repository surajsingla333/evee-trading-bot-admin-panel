import { useEffect, useState } from 'react'
import { MoreHorizontal, RefreshCw } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { SearchInput } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Table, THead, Th, TBody, Tr, Td, TablePagination } from '@/components/ui/Table'
import {
  getUserDetails,
  getUsers,
  getUserTrades,
  type NormalizedTrade,
  type UserDetails,
  type UserRow,
  type UsersResult,
  type UserTradesResult,
} from '@/services/users'
import { formatCurrency, formatRelativeTime } from '@/lib/format'
import type { BadgeVariant } from '@/types'

const detailTabs = ['Profile', 'Wallets', 'Positions', 'Orders', 'Referral', 'Trades'] as const

const tradeStatusVariant: Record<string, BadgeVariant> = {
  completed: 'success',
  pending: 'pending',
  failed: 'error',
}

function displayName(user: UserRow) {
  return user.name || user.username || user.id
}

function initialsFor(user: UserRow) {
  const source = displayName(user)
  return source.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '??'
}

function txExplorerUrl(t: NormalizedTrade) {
  if (!t.txHash) return null
  return t.chain === 'robinhood'
    ? `https://robinhoodchain.blockscout.com/tx/${t.txHash}`
    : `https://solscan.io/tx/${t.txHash}`
}

function TradeCard({ t }: { t: NormalizedTrade }) {
  const explorer = txExplorerUrl(t)
  return (
    <div className="rounded-[14px] border border-border dark:border-border-dark px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {t.tokenSymbol || t.tokenAddress.slice(0, 6)}
            </span>
            <Badge variant={t.type === 'buy' ? 'success' : 'info'} className="capitalize">
              {t.type}
            </Badge>
            <Badge variant={t.chain === 'solana' ? 'info' : 'warning'} className="capitalize">
              {t.chain}
            </Badge>
            <Badge variant={tradeStatusVariant[t.status] ?? 'neutral'} dot className="capitalize">
              {t.status}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted">
            {t.nativeAmount} {t.nativeUnit}
            {t.amount != null ? ` · ${t.amount} tokens` : ''}
            {t.priceUsd != null ? ` · $${t.priceUsd}` : ''}
            {t.provider ? ` · ${t.provider}` : ''}
          </p>
        </div>
        <div className="text-right shrink-0">
          {t.pnl != null && (
            <p
              className={`text-sm font-medium ${t.pnl >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
            >
              {t.pnl >= 0 ? '+' : ''}
              {t.pnl}
              {t.pnlPercentage != null && (
                <span className="ml-1 text-[11px] text-muted">({t.pnlPercentage}%)</span>
              )}
            </p>
          )}
          {t.timestamp && (
            <p className="text-[11px] text-muted">{formatRelativeTime(t.timestamp)}</p>
          )}
        </div>
      </div>
      {explorer && (
        <a
          href={explorer}
          target="_blank"
          rel="noreferrer"
          className="mt-1.5 inline-block text-[11px] font-mono text-primary-600 hover:text-primary-700"
        >
          {t.txHash!.slice(0, 16)}…
        </a>
      )}
    </div>
  )
}

export function UsersPage() {
  const [data, setData] = useState<UsersResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  const [selected, setSelected] = useState<UserRow | null>(null)
  const [details, setDetails] = useState<UserDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [tab, setTab] = useState<(typeof detailTabs)[number]>('Profile')

  const [trades, setTrades] = useState<UserTradesResult | null>(null)
  const [tradesPage, setTradesPage] = useState(1)
  const [tradesReloadKey, setTradesReloadKey] = useState(0)
  const [tradesLoading, setTradesLoading] = useState(false)
  const [tradesError, setTradesError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    // Debounce so we don't refetch on every keystroke
    const timer = setTimeout(async () => {
      try {
        const result = await getUsers({ page, search, status })
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load users')
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
  }, [page, search, status, reloadKey])

  useEffect(() => {
    if (!selected) {
      setDetails(null)
      return
    }
    let cancelled = false
    setDetailsLoading(true)
    setDetailsError(null)
    setTab('Profile')

    getUserDetails(selected.id)
      .then((d) => {
        if (!cancelled) setDetails(d)
      })
      .catch((err) => {
        if (!cancelled) {
          setDetailsError(err instanceof Error ? err.message : 'Failed to load user details')
        }
      })
      .finally(() => {
        if (!cancelled) setDetailsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selected])

  useEffect(() => {
    if (!selected) {
      setTrades(null)
      return
    }
    let cancelled = false
    setTradesLoading(true)
    setTradesError(null)

    getUserTrades(selected.id, { page: tradesPage })
      .then((result) => {
        if (!cancelled) setTrades(result)
      })
      .catch((err) => {
        if (!cancelled) {
          setTradesError(err instanceof Error ? err.message : 'Failed to load trades')
          setTrades(null)
        }
      })
      .finally(() => {
        if (!cancelled) setTradesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selected, tradesPage, tradesReloadKey])

  const openUser = (user: UserRow) => {
    setSelected(user)
    setTradesPage(1)
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Telegram bot users across Solana and Robinhood."
        actions={
          <Button variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          placeholder="Search user ID, username, or referral code…"
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
            { label: 'Active (30d)', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ]}
          className="lg:w-44"
        />
        {data && (
          <p className="text-sm text-muted">
            {data.total} user{data.total === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {loading ? (
        <SkeletonTable rows={8} />
      ) : error ? (
        <div className="card-surface p-8 max-w-xl">
          <p className="text-sm font-medium text-slate-900 dark:text-white">Failed to load users</p>
          <p className="mt-1 text-sm text-muted">{error}</p>
          <Button className="mt-4" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="card-surface p-10 text-center">
          <p className="text-sm font-medium text-slate-900 dark:text-white">No users found</p>
          <p className="mt-1 text-sm text-muted">
            {search || status ? 'Try different filters.' : 'The API returned no users.'}
          </p>
        </div>
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <Th>User</Th>
                <Th>Referral Code</Th>
                <Th>Referred By</Th>
                <Th>Referrals</Th>
                <Th>Wallets</Th>
                <Th>Status</Th>
                <Th>Registered</Th>
                <Th>Last Active</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </THead>
            <TBody>
              {data.items.map((user) => (
                <Tr key={user.id} onClick={() => openUser(user)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar initials={initialsFor(user)} name={displayName(user)} />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {user.username ? `@${user.username}` : displayName(user)}
                        </p>
                        <p className="text-xs text-muted">{user.id}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    {user.referralCode ? (
                      <code className="rounded-lg bg-surface dark:bg-slate-800 px-2 py-1 text-xs font-medium">
                        {user.referralCode}
                      </code>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </Td>
                  <Td>
                    {user.referredBy ? (
                      <span className="text-xs">
                        {user.referredBy.username
                          ? `@${user.referredBy.username}`
                          : user.referredBy.userId}
                      </span>
                    ) : (
                      <Badge variant="neutral">Organic</Badge>
                    )}
                  </Td>
                  <Td>{user.referralsCount}</Td>
                  <Td>{user.walletCount ?? '—'}</Td>
                  <Td>
                    {user.status ? (
                      <Badge
                        variant={user.status === 'active' ? 'success' : 'neutral'}
                        dot
                        className="capitalize"
                      >
                        {user.status}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </Td>
                  <Td>{user.registeredAt ? formatRelativeTime(user.registeredAt) : '—'}</Td>
                  <Td>{user.lastActive ? formatRelativeTime(user.lastActive) : '—'}</Td>
                  <Td className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        openUser(user)
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
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

      {selected && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                Trades — {selected.username ? `@${selected.username}` : displayName(selected)}
              </h2>
              <p className="text-sm text-muted">
                Solana and Robinhood trades, newest first
                {trades ? ` · ${trades.total} total` : ''}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setSelected(null)}>
              Clear
            </Button>
          </div>

          {tradesLoading ? (
            <SkeletonTable rows={5} />
          ) : tradesError ? (
            <div className="card-surface p-8 max-w-xl">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Failed to load trades
              </p>
              <p className="mt-1 text-sm text-muted">{tradesError}</p>
              <Button className="mt-4" onClick={() => setTradesReloadKey((k) => k + 1)}>
                <RefreshCw className="h-4 w-4" /> Retry
              </Button>
            </div>
          ) : !trades || trades.items.length === 0 ? (
            <div className="card-surface p-10 text-center">
              <p className="text-sm font-medium text-slate-900 dark:text-white">No trades</p>
              <p className="mt-1 text-sm text-muted">This user has not traded yet.</p>
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
                    <Th>Token Amount</Th>
                    <Th>Price (USD)</Th>
                    <Th>PnL</Th>
                    <Th>Status</Th>
                    <Th>Provider</Th>
                    <Th>Tx</Th>
                    <Th>Time</Th>
                  </tr>
                </THead>
                <TBody>
                  {trades.items.map((t) => {
                    const explorer = txExplorerUrl(t)
                    return (
                      <Tr key={t.id}>
                        <Td>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {t.tokenSymbol || t.tokenAddress.slice(0, 8)}
                            </p>
                            {t.tokenName && <p className="text-xs text-muted">{t.tokenName}</p>}
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
                        <Td>{t.amount ?? '—'}</Td>
                        <Td>{t.priceUsd != null ? `$${t.priceUsd}` : '—'}</Td>
                        <Td>
                          {t.pnl != null ? (
                            <span
                              className={t.pnl >= 0 ? 'text-emerald-600' : 'text-red-500'}
                            >
                              {t.pnl >= 0 ? '+' : ''}
                              {t.pnl}
                            </span>
                          ) : (
                            '—'
                          )}
                        </Td>
                        <Td>
                          <Badge
                            variant={tradeStatusVariant[t.status] ?? 'neutral'}
                            dot
                            className="capitalize"
                          >
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
              {trades.totalPages > 1 && (
                <div className="card-surface mt-0 rounded-t-none border-t-0">
                  <TablePagination
                    page={trades.page}
                    totalPages={trades.totalPages}
                    onPageChange={setTradesPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? (selected.username ? `@${selected.username}` : displayName(selected)) : ''}
        description={selected ? `Telegram ID · ${selected.id}` : undefined}
        width="max-w-xl"
      >
        {selected && (
          <div>
            <div className="flex flex-wrap gap-1 p-1 rounded-[14px] bg-surface dark:bg-slate-800/60 mb-6">
              {detailTabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors ${
                    tab === t
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-soft'
                      : 'text-muted hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {t}
                  {t === 'Wallets' && details ? ` (${details.wallets.total})` : ''}
                  {t === 'Positions' && details ? ` (${details.positions.open})` : ''}
                  {t === 'Orders' && details ? ` (${details.limitOrders.pending})` : ''}
                  {t === 'Trades' && trades ? ` (${trades.total})` : ''}
                </button>
              ))}
            </div>

            {detailsLoading && tab !== 'Trades' && (
              <p className="py-8 text-center text-sm text-muted">Loading user details…</p>
            )}

            {detailsError && tab !== 'Trades' && (
              <div className="rounded-[16px] border border-dashed border-border dark:border-border-dark p-6 text-center">
                <p className="text-sm text-red-500">{detailsError}</p>
              </div>
            )}

            {!detailsLoading && !detailsError && details && tab === 'Profile' && (
              <div>
                <dl className="space-y-4">
                  {[
                    ['Telegram ID', details.profile.id],
                    ['Username', details.profile.username ? `@${details.profile.username}` : '—'],
                    ['Name', details.profile.name ?? '—'],
                    ['Status', details.profile.status ?? '—'],
                    [
                      'Registered',
                      details.profile.registeredAt
                        ? new Date(details.profile.registeredAt).toLocaleString()
                        : '—',
                    ],
                    [
                      'Last Active',
                      details.profile.lastActive
                        ? new Date(details.profile.lastActive).toLocaleString()
                        : '—',
                    ],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between gap-4 border-b border-border dark:border-border-dark pb-3"
                    >
                      <dt className="text-sm text-muted">{k}</dt>
                      <dd className="text-sm font-medium text-slate-900 dark:text-white break-all text-right capitalize">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>

                {details.tradingStats && (
                  <div className="mt-6">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                      Trading Stats
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['Total Trades', String(details.tradingStats.totalTrades)],
                        ['Buys / Sells', `${details.tradingStats.buys} / ${details.tradingStats.sells}`],
                        ['Failed', String(details.tradingStats.failedTrades)],
                        ['Volume', formatCurrency(details.tradingStats.volumeUsd)],
                        ['Realized PnL', formatCurrency(details.tradingStats.realizedPnlUsd)],
                        [
                          'Solana / Robinhood',
                          `${details.tradingStats.solanaTrades} / ${details.tradingStats.robinhoodTrades}`,
                        ],
                      ].map(([k, v]) => (
                        <div
                          key={k}
                          className="rounded-[14px] border border-border dark:border-border-dark px-3 py-2.5"
                        >
                          <p className="text-[11px] text-muted">{k}</p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
                            {v}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                    Settings
                  </p>
                  {Object.keys(details.profile.settings).length === 0 ? (
                    <p className="text-sm text-muted">No settings stored.</p>
                  ) : (
                    <pre className="rounded-[14px] bg-surface dark:bg-slate-800/60 p-4 text-xs leading-relaxed overflow-x-auto">
                      {JSON.stringify(details.profile.settings, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {!detailsLoading && !detailsError && details && tab === 'Wallets' && (
              <div>
                <p className="mb-3 text-xs text-muted">
                  {details.wallets.solana} Solana · {details.wallets.robinhood} Robinhood
                </p>
                <div className="space-y-2">
                  {details.wallets.items.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted">No wallets for this user.</p>
                  ) : (
                    details.wallets.items.map((w, i) => (
                      <div
                        key={`${w.address}-${i}`}
                        className="rounded-[14px] border border-border dark:border-border-dark px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-xs font-mono truncate">{w.address || '—'}</code>
                          <div className="flex shrink-0 gap-1.5">
                            <Badge
                              variant={w.chain === 'solana' ? 'info' : 'warning'}
                              className="capitalize"
                            >
                              {w.chain}
                            </Badge>
                            <Badge variant={w.isActive ? 'success' : 'neutral'} dot>
                              {w.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        <p className="mt-1.5 text-xs text-muted">
                          {w.label ? `${w.label} · ` : ''}
                          {w.type || 'DEFAULT'}
                          {w.createdAt ? ` · created ${formatRelativeTime(w.createdAt)}` : ''}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {!detailsLoading && !detailsError && details && tab === 'Positions' && (
              <div>
                <p className="mb-3 text-xs text-muted">
                  {details.positions.open} open · {details.positions.closed} closed
                </p>
                <div className="space-y-2">
                  {details.positions.items.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted">No open positions.</p>
                  ) : (
                    details.positions.items.map((p, i) => (
                      <div
                        key={`${p.tokenAddress}-${i}`}
                        className="flex items-center justify-between rounded-[14px] border border-border dark:border-border-dark px-4 py-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {p.tokenSymbol || p.tokenAddress.slice(0, 6)}
                            </p>
                            <Badge
                              variant={p.chain === 'solana' ? 'info' : 'warning'}
                              className="capitalize"
                            >
                              {p.chain}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted">
                            {p.amount} · in {formatCurrency(p.totalInvested)} · now{' '}
                            {formatCurrency(p.currentValue)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-medium ${p.unrealizedPnL >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                          >
                            {p.unrealizedPnL >= 0 ? '+' : ''}
                            {formatCurrency(p.unrealizedPnL)}
                            {p.pnlPercentage != null && (
                              <span className="ml-1 text-[11px] text-muted">
                                ({p.pnlPercentage}%)
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-muted capitalize">{p.status}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {!detailsLoading && !detailsError && details && tab === 'Orders' && (
              <div className="space-y-2">
                {details.limitOrders.items.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">No pending limit orders.</p>
                ) : (
                  details.limitOrders.items.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between rounded-[14px] border border-border dark:border-border-dark px-4 py-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono">{o.tokenAddress.slice(0, 10)}…</code>
                          <Badge
                            variant={o.orderType === 'buy' ? 'success' : 'info'}
                            className="capitalize"
                          >
                            {o.orderType}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted">
                          {o.amount}
                          {o.targetPrice != null ? ` @ ${o.targetPrice}` : ''}
                          {o.targetPercentage != null ? ` · ${o.targetPercentage}%` : ''}
                          {o.targetMCap != null ? ` · MCap ${o.targetMCap}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="pending" dot className="capitalize">
                          {o.status}
                        </Badge>
                        {o.createdAt && (
                          <p className="mt-1 text-[11px] text-muted">
                            {formatRelativeTime(o.createdAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {!detailsLoading && !detailsError && details && tab === 'Referral' && (
              <div>
                <dl className="space-y-4">
                  {[
                    ['Referral Code', details.referral?.referralCode ?? '—'],
                    [
                      'Referred By',
                      details.referral?.referredBy
                        ? details.referral.referredBy.username
                          ? `@${details.referral.referredBy.username}`
                          : details.referral.referredBy.userId
                        : 'Organic',
                    ],
                    ['Referrals', String(details.referral?.referralsCount ?? 0)],
                    [
                      'Total Paid Out',
                      details.referral
                        ? `${details.referral.totalPaidOutSol} SOL (${formatCurrency(details.referral.totalPaidOutUsd)})`
                        : '—',
                    ],
                    ['Pending Claims', String(details.referral?.pendingClaims ?? 0)],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between gap-4 border-b border-border dark:border-border-dark pb-3"
                    >
                      <dt className="text-sm text-muted">{k}</dt>
                      <dd className="text-sm font-medium text-slate-900 dark:text-white break-all text-right">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>

                {details.referral && details.referral.referredUsers.length > 0 && (
                  <div className="mt-6">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                      Referred Users
                    </p>
                    <div className="space-y-2">
                      {details.referral.referredUsers.map((r) => (
                        <div
                          key={r.userId}
                          className="flex items-center justify-between rounded-[14px] border border-border dark:border-border-dark px-4 py-2.5"
                        >
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {r.username ? `@${r.username}` : r.userId}
                          </p>
                          <p className="text-[11px] text-muted">
                            {r.joinedAt ? formatRelativeTime(r.joinedAt) : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'Trades' && (
              <div>
                {tradesLoading ? (
                  <p className="py-8 text-center text-sm text-muted">Loading trades…</p>
                ) : tradesError ? (
                  <div className="rounded-[16px] border border-dashed border-border dark:border-border-dark p-6 text-center">
                    <p className="text-sm text-red-500">{tradesError}</p>
                  </div>
                ) : !trades || trades.items.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">No trades for this user.</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {trades.items.map((t) => (
                        <TradeCard key={t.id} t={t} />
                      ))}
                    </div>
                    {trades.totalPages > 1 && (
                      <div className="mt-4 flex items-center justify-between">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={trades.page <= 1}
                          onClick={() => setTradesPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <p className="text-xs text-muted">
                          Page {trades.page} of {trades.totalPages}
                        </p>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={trades.page >= trades.totalPages}
                          onClick={() => setTradesPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
