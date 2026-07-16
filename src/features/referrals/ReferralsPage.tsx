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

function rewardLabel(usd: number, sol: number | null) {
  if (sol != null && sol > 0 && usd === 0) return `${sol} SOL`
  if (sol != null && sol > 0) return `${formatCurrency(usd)} · ${sol} SOL`
  return formatCurrency(usd)
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

  const pendingTotal = data?.items.reduce((s, r) => s + r.pendingRewards, 0) ?? 0
  const paidTotal = data?.items.reduce((s, r) => s + r.paidRewards, 0) ?? 0
  const activeCount = data?.items.filter((r) => r.status === 'active').length ?? 0
  const claimableTotal = data?.items.reduce((s, r) => s + r.claimableRewards, 0) ?? 0

  return (
    <div>
      <PageHeader
        title="Referrals"
        description="Claim v2 referral ledger — volume, claimable rewards, and payout status."
        actions={
          <Button variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-5">
          <p className="text-[13px] text-muted font-medium">Pending Rewards</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600">
            {formatCurrency(pendingTotal)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] text-muted font-medium">Paid Rewards</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">
            {formatCurrency(paidTotal)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] text-muted font-medium">Claimable</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {formatCurrency(claimableTotal)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] text-muted font-medium">Active Referrers</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {activeCount}
            {data ? (
              <span className="ml-2 text-sm font-normal text-muted">/ {data.total}</span>
            ) : null}
          </p>
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
                        {r.volumeSol} SOL
                        {r.volumeEth > 0 ? ` · ${r.volumeEth} ETH` : ''}
                      </p>
                    </div>
                  </Td>
                  <Td className="text-amber-600 font-medium">
                    {rewardLabel(r.pendingRewards, r.pendingRewardsSol)}
                  </Td>
                  <Td className="text-emerald-600 font-medium">
                    {rewardLabel(r.paidRewards, r.paidRewardsSol)}
                  </Td>
                  <Td className="font-medium">
                    {rewardLabel(r.claimableRewards, r.claimableRewardsSol)}
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
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Referrals', String(detail.referrals)],
                    ['Active', String(detail.activeReferrals)],
                    ['Volume USD', formatCurrency(detail.volumeUsd)],
                    [
                      'Volume Native',
                      `${detail.volumeSol} SOL${detail.volumeEth > 0 ? ` · ${detail.volumeEth} ETH` : ''}`,
                    ],
                    ['Pending', formatCurrency(detail.pendingRewards)],
                    ['Paid', formatCurrency(detail.paidRewards)],
                    ['Claimable', formatCurrency(detail.claimableRewards)],
                    ['Status', detail.status],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="rounded-[14px] border border-border dark:border-border-dark px-3 py-2.5"
                    >
                      <p className="text-[11px] text-muted">{k}</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white capitalize">
                        {v}
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                    Referred Users
                  </p>
                  {detail.referredUsers.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted">No referred users yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {detail.referredUsers.map((u) => (
                        <div
                          key={u.userId}
                          className="flex items-center justify-between rounded-[14px] border border-border dark:border-border-dark px-4 py-2.5"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {u.username ? `@${u.username}` : u.userId}
                            </p>
                            {u.joinedAt && (
                              <p className="text-[11px] text-muted">
                                Joined {formatRelativeTime(u.joinedAt)}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge variant={u.traded ? 'success' : 'neutral'} dot>
                              {u.traded ? 'Traded' : 'No trades'}
                            </Badge>
                            {u.volumeUsd > 0 && (
                              <p className="mt-1 text-[11px] text-muted">
                                {formatCurrency(u.volumeUsd)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                    Claim History
                  </p>
                  {detail.claims.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted">No claims yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {detail.claims.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-[14px] border border-border dark:border-border-dark px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {c.amountUsd > 0
                                  ? formatCurrency(c.amountUsd)
                                  : `${c.amountSol} SOL`}
                                {c.amountUsd > 0 && c.amountSol > 0 && (
                                  <span className="ml-1 text-xs font-normal text-muted">
                                    · {c.amountSol} SOL
                                  </span>
                                )}
                              </p>
                              {c.wallet && (
                                <code className="text-[11px] text-muted">{c.wallet}</code>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <Badge
                                variant={claimStatusVariant[c.status] ?? 'neutral'}
                                dot
                                className="capitalize"
                              >
                                {c.status}
                              </Badge>
                              {c.createdAt && (
                                <p className="mt-1 text-[11px] text-muted">
                                  {formatRelativeTime(c.createdAt)}
                                </p>
                              )}
                            </div>
                          </div>
                          {c.txHash && (
                            <p className="mt-1.5 font-mono text-[11px] text-muted truncate">
                              {c.txHash}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
