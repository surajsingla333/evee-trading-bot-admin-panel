import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Table, THead, Th, TBody, Tr, Td, TablePagination } from '@/components/ui/Table'
import {
  getReferralPayments,
  type ReferralPaymentRow,
  type ReferralPaymentsResult,
} from '@/services/referrals'
import type { BadgeVariant } from '@/types'
import { formatCurrency, formatRelativeTime } from '@/lib/format'

const statusVariant: Record<ReferralPaymentRow['status'], BadgeVariant> = {
  paid: 'success',
  pending: 'pending',
  failed: 'error',
}

function shortHash(hash: string | null) {
  if (!hash || hash === '—') return '—'
  if (hash.length <= 14) return hash
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`
}

function shortWallet(wallet: string | null) {
  if (!wallet) return '—'
  if (wallet.length <= 14) return wallet
  return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`
}

export function ReferralPaymentsPage() {
  const [data, setData] = useState<ReferralPaymentsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'' | 'pending' | 'paid' | 'failed'>('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getReferralPayments({ page, status })
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load referral payments')
          setData(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, status, reloadKey])

  return (
    <div>
      <PageHeader
        title="Referral Payments"
        description="Claim ledger — pending and paid referral disbursements."
        actions={
          <Button variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          placeholder="Status"
          value={status}
          onChange={(v) => {
            setStatus(v as '' | 'pending' | 'paid' | 'failed')
            setPage(1)
          }}
          options={[
            { label: 'Pending', value: 'pending' },
            { label: 'Paid', value: 'paid' },
            { label: 'Failed', value: 'failed' },
          ]}
          className="w-40"
        />
        {data && (
          <p className="text-sm text-muted">
            {data.total} payment{data.total === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {loading ? (
        <SkeletonTable rows={8} />
      ) : error ? (
        <div className="card-surface p-8 max-w-xl">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            Failed to load referral payments
          </p>
          <p className="mt-1 text-sm text-muted">{error}</p>
          <Button className="mt-4" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="card-surface p-10 text-center">
          <p className="text-sm font-medium text-slate-900 dark:text-white">No payments found</p>
          <p className="mt-1 text-sm text-muted">
            {status ? 'Try a different status filter.' : 'The claim ledger is empty.'}
          </p>
        </div>
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <Th>User</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Wallet</Th>
                <Th>Hash</Th>
                <Th>Time</Th>
              </tr>
            </THead>
            <TBody>
              {data.items.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {p.userName || p.userId || '—'}
                      </p>
                      {p.userName && p.userId && (
                        <p className="text-xs font-mono text-muted">{p.userId}</p>
                      )}
                    </div>
                  </Td>
                  <Td className="font-semibold">
                    {formatCurrency(p.amount)}
                    {p.amountSol != null && p.amountSol > 0 && (
                      <span className="ml-1 text-xs font-normal text-muted">
                        · {p.amountSol} SOL
                      </span>
                    )}
                  </Td>
                  <Td>
                    <Badge variant={statusVariant[p.status]} dot className="capitalize">
                      {p.status}
                    </Badge>
                  </Td>
                  <Td>
                    <code className="font-mono text-xs" title={p.wallet ?? undefined}>
                      {shortWallet(p.wallet)}
                    </code>
                  </Td>
                  <Td>
                    <code className="font-mono text-xs text-muted" title={p.hash ?? undefined}>
                      {shortHash(p.hash)}
                    </code>
                  </Td>
                  <Td>{p.time ? formatRelativeTime(p.time) : '—'}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          <div className="card-surface mt-0 rounded-t-none border-t-0">
            <TablePagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  )
}
