import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Drawer'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Table, THead, Th, TBody, Tr, Td, TablePagination } from '@/components/ui/Table'
import {
  getReferralDetail,
  getReferrals,
  type ReferralDetail,
  type ReferralRow,
  type ReferralsResult,
} from '@/services/referrals'
import { formatCurrency, formatRelativeTime } from '@/lib/format'
import type { BadgeVariant } from '@/types'

const claimStatusVariant: Record<string, BadgeVariant> = {
  paid: 'success',
  pending: 'pending',
  failed: 'error',
}

function displayName(r: { userName: string | null; userId: string }) {
  return r.userName || r.userId
}

function formatSol(amount: number) {
  if (amount === 0) return '0 SOL'
  if (Math.abs(amount) < 0.0001) return `${amount.toExponential(2)} SOL`
  return `${Number(amount.toFixed(6))} SOL`
}

function lamportsToSol(lamports: string | null | undefined) {
  if (!lamports) return 0
  const n = Number(lamports)
  return Number.isFinite(n) ? n / 1e9 : 0
}

function weiToEth(wei: string | null | undefined) {
  if (!wei) return 0
  const n = Number(wei)
  return Number.isFinite(n) ? n / 1e18 : 0
}

function rewardCell(sol: number, usd: number) {
  return (
    <div>
      <p className="font-medium">{formatSol(sol)}</p>
      {usd > 0 && <p className="text-[11px] text-muted">{formatCurrency(usd)}</p>}
    </div>
  )
}

export function ReferralsPage() {
  const [data, setData] = useState<ReferralsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  const [selected, setSelected] = useState<ReferralRow | null>(null)
  const [detail, setDetail] = useState<ReferralDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const timer = setTimeout(async () => {
      try {
        const result = await getReferrals({
          page,
          search: search.trim() || undefined,
          status,
        })
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load referrals')
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
      setDetail(null)
      return
    }
    let cancelled = false
    setDetailLoading(true)
    setDetailError(null)

    getReferralDetail(selected.userId)
      .then((d) => {
        if (!cancelled) setDetail(d)
      })
      .catch((err) => {
        if (!cancelled) {
          setDetailError(err instanceof Error ? err.message : 'Failed to load referral detail')
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selected])

  const pendingUsd = data?.items.reduce((s, r) => s + r.pendingRewardsUsd, 0) ?? 0
  const pendingSol = data?.items.reduce((s, r) => s + r.pendingRewards, 0) ?? 0
  const paidUsd = data?.items.reduce((s, r) => s + r.paidRewardsUsd, 0) ?? 0
  const paidSol = data?.items.reduce((s, r) => s + r.paidRewards, 0) ?? 0
  const claimableUsd = data?.items.reduce((s, r) => s + r.claimableRewardsUsd, 0) ?? 0
  const claimableSol = data?.items.reduce((s, r) => s + r.claimableRewards, 0) ?? 0
  const activeCount = data?.items.filter((r) => r.status === 'active').length ?? 0
  const rewardPct = data ? data.rewardRate * 100 : 0.1

  return (
    <div>
      <PageHeader
        title="Referrals"
        description={
          data
            ? `Claim v2 ledger · ${rewardPct}% of referral volume${
                data.prices.solPriceUsd != null
                  ? ` · SOL $${data.prices.solPriceUsd}`
                  : ''
              }${
                data.prices.ethPriceUsd != null
                  ? ` · ETH $${data.prices.ethPriceUsd}`
                  : ''
              }`
            : 'Claim v2 referral ledger — volume, claimable rewards, and payout status.'
        }
        actions={
          <Button variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-5">
          <p className="text-[13px] text-muted font-medium">Pending Rewards</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600">{formatSol(pendingSol)}</p>
          <p className="mt-1 text-xs text-muted">{formatCurrency(pendingUsd)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] text-muted font-medium">Paid Rewards</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{formatSol(paidSol)}</p>
          <p className="mt-1 text-xs text-muted">{formatCurrency(paidUsd)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] text-muted font-medium">Claimable</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {formatSol(claimableSol)}
          </p>
          <p className="mt-1 text-xs text-muted">{formatCurrency(claimableUsd)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] text-muted font-medium">Active Referrers</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {activeCount}
            {data ? (
              <span className="ml-2 text-sm font-normal text-muted">/ {data.total}</span>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-muted">Reward rate {rewardPct}%</p>
        </Card>
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          placeholder="Search user ID, name, or code…"
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
      </div>

      {loading ? (
        <SkeletonTable rows={8} />
      ) : error ? (
        <div className="card-surface p-8 max-w-xl">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            Failed to load referrals
          </p>
          <p className="mt-1 text-sm text-muted">{error}</p>
          <Button className="mt-4" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="card-surface p-10 text-center">
          <p className="text-sm font-medium text-slate-900 dark:text-white">No referrals found</p>
          <p className="mt-1 text-sm text-muted">
            {search || status ? 'Try different filters.' : 'The API returned no referral rows.'}
          </p>
        </div>
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <Th>User</Th>
                <Th>Code</Th>
                <Th>Referrals</Th>
                <Th>Active</Th>
                <Th>Volume</Th>
                <Th>Pending</Th>
                <Th>Paid</Th>
                <Th>Claimable</Th>
                <Th>Claims</Th>
                <Th>Last Volume</Th>
                <Th>Status</Th>
              </tr>
            </THead>
            <TBody>
              {data.items.map((r) => (
                <Tr key={r.id} onClick={() => setSelected(r)}>
                  <Td>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {displayName(r)}
                      </p>
                      {r.userName && (
                        <p className="text-xs font-mono text-muted">{r.userId}</p>
                      )}
                    </div>
                  </Td>
                  <Td>
                    {r.code ? (
                      <code className="rounded-lg bg-surface dark:bg-slate-800 px-2 py-1 text-xs font-medium">
                        {r.code}
                      </code>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td>{r.referrals}</Td>
                  <Td>{r.activeReferrals}</Td>
                  <Td>
                    <div>
                      <p className="font-medium">{formatCurrency(r.volumeUsd)}</p>
                      <p className="text-[11px] text-muted">
                        {formatSol(r.volumeSol)}
                        {r.volumeEth > 0 ? ` · ${r.volumeEth} ETH` : ''}
                      </p>
                    </div>
                  </Td>
                  <Td className="text-amber-600">
                    {rewardCell(r.pendingRewards, r.pendingRewardsUsd)}
                  </Td>
                  <Td className="text-emerald-600">
                    {rewardCell(r.paidRewards, r.paidRewardsUsd)}
                  </Td>
                  <Td>{rewardCell(r.claimableRewards, r.claimableRewardsUsd)}</Td>
                  <Td>{r.pendingClaims}</Td>
                  <Td>
                    {r.lastVolumeAt ? formatRelativeTime(r.lastVolumeAt) : '—'}
                  </Td>
                  <Td>
                    <Badge
                      variant={r.status === 'active' ? 'success' : 'neutral'}
                      dot
                      className="capitalize"
                    >
                      {r.status}
                    </Badge>
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
        title={selected ? displayName(selected) : ''}
        description={
          selected
            ? `Telegram ID · ${selected.userId}${selected.code ? ` · ${selected.code}` : ''}`
            : undefined
        }
        width="max-w-xl"
      >
        {selected && (
          <div>
            {detailLoading && (
              <p className="py-8 text-center text-sm text-muted">Loading referral detail…</p>
            )}
            {detailError && (
              <div className="rounded-[16px] border border-dashed border-border dark:border-border-dark p-6 text-center">
                <p className="text-sm text-red-500">{detailError}</p>
              </div>
            )}
            {!detailLoading && !detailError && detail && (
              <div className="space-y-6">
                {(() => {
                  const r = detail.referrer ?? selected
                  const volSol = lamportsToSol(detail.volume?.solLamports)
                  const volEth = weiToEth(detail.volume?.ethWei)
                  const rewardPct = detail.rewardRate * 100
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          [
                            'Pending',
                            `${formatSol(r.pendingRewards)} · ${formatCurrency(r.pendingRewardsUsd)}`,
                          ],
                          [
                            'Paid',
                            `${formatSol(r.paidRewards)} · ${formatCurrency(r.paidRewardsUsd)}`,
                          ],
                          [
                            'Claimable',
                            `${formatSol(r.claimableRewards)} · ${formatCurrency(r.claimableRewardsUsd)}`,
                          ],
                          ['Pending Claims', String(r.pendingClaims)],
                          ['Referrals / Active', `${r.referrals} / ${r.activeReferrals}`],
                          ['Reward Rate', `${rewardPct}%`],
                          [
                            'Volume (ledger)',
                            `${formatSol(volSol)}${volEth > 0 ? ` · ${Number(volEth.toFixed(6))} ETH` : ''}`,
                          ],
                          [
                            'Volume USD',
                            formatCurrency(r.volumeUsd),
                          ],
                          [
                            'Active Traders',
                            String(detail.volume?.activeTraderIds.length ?? r.activeReferrals),
                          ],
                          [
                            'Last Volume',
                            detail.volume?.updatedAt || r.lastVolumeAt
                              ? new Date(
                                  (detail.volume?.updatedAt || r.lastVolumeAt) as string,
                                ).toLocaleString()
                              : '—',
                          ],
                          [
                            'SOL Price',
                            detail.prices.solPriceUsd != null
                              ? `$${detail.prices.solPriceUsd}`
                              : '—',
                          ],
                          [
                            'ETH Price',
                            detail.prices.ethPriceUsd != null
                              ? `$${detail.prices.ethPriceUsd}`
                              : '—',
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

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                          Referred Users ({detail.referredUsers.length})
                        </p>
                        {detail.referredUsers.length === 0 ? (
                          <p className="py-4 text-center text-sm text-muted">
                            No referred users yet.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {detail.referredUsers.map((u) => (
                              <div
                                key={u.userId}
                                className="flex items-center justify-between rounded-[14px] border border-border dark:border-border-dark px-4 py-2.5"
                              >
                                <div>
                                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                                    {u.userName || u.userId}
                                  </p>
                                  <p className="text-[11px] text-muted font-mono">
                                    {u.userId}
                                    {u.referralCode ? ` · ${u.referralCode}` : ''}
                                  </p>
                                  {u.registeredAt && (
                                    <p className="text-[11px] text-muted">
                                      Joined {formatRelativeTime(u.registeredAt)}
                                    </p>
                                  )}
                                </div>
                                <Badge variant={u.traded ? 'success' : 'neutral'} dot>
                                  {u.traded ? 'Traded' : 'No trades'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                          Claim History ({detail.claims.length})
                        </p>
                        {detail.claims.length === 0 ? (
                          <p className="py-4 text-center text-sm text-muted">No claims yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {detail.claims.map((c) => {
                              const statusKey = c.status.toLowerCase()
                              return (
                                <div
                                  key={c.id}
                                  className="rounded-[14px] border border-border dark:border-border-dark px-4 py-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {formatSol(c.amountSol)}
                                      </p>
                                      {c.telegramHandle && (
                                        <p className="text-[11px] text-muted">
                                          @{c.telegramHandle.replace(/^@/, '')}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right shrink-0">
                                      <Badge
                                        variant={claimStatusVariant[statusKey] ?? 'neutral'}
                                        dot
                                        className="capitalize"
                                      >
                                        {c.status}
                                      </Badge>
                                      {c.createdAt && (
                                        <p className="mt-1 text-[11px] text-muted">
                                          Created {formatRelativeTime(c.createdAt)}
                                        </p>
                                      )}
                                      {c.paidAt && (
                                        <p className="text-[11px] text-muted">
                                          Paid {formatRelativeTime(c.paidAt)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  {c.payoutTxHash && (
                                    <p className="mt-1.5 font-mono text-[11px] text-muted truncate">
                                      {c.payoutTxHash}
                                    </p>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
