import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Drawer'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import { Table, THead, Th, TBody, Tr, Td, TablePagination } from '@/components/ui/Table'
import {
  autoPayClaim,
  claimErrorMessage,
  confirmClaimPayout,
  getPayoutMode,
  getReferralPayments,
  hasPoolForChain,
  prepareClaimPayout,
  processAutoPayouts,
  rejectClaim,
  setReferralAutoPayout,
  txExplorerUrl,
  type ClaimActionError,
  type ClaimChain,
  type PayoutMode,
  type PreparePayoutResult,
  type ReferralPaymentRow,
  type ReferralPaymentsResult,
} from '@/services/referralPayments'
import { ManualWalletPayButton } from '@/features/referral-payments/ManualWalletPayButton'
import type { BadgeVariant } from '@/types'
import { formatCurrency, formatRelativeTime } from '@/lib/format'

type PayPhase =
  | 'idle'
  | 'preparing'
  | 'ready'
  | 'paying'
  | 'confirming'
  | 'done'
  | 'error'

const statusVariant: Record<string, BadgeVariant> = {
  paid: 'success',
  pending: 'pending',
  approved: 'info',
  rejected: 'neutral',
  failed: 'error',
}

function formatAmount(amount: number, currency: string) {
  if (amount === 0) return `0 ${currency}`
  return `${Number(amount.toFixed(6))} ${currency}`
}

function shortHash(hash: string | null) {
  if (!hash) return '—'
  if (hash.length <= 16) return hash
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`
}

export function ReferralPaymentsPage() {
  const [mode, setMode] = useState<PayoutMode | null>(null)
  const [data, setData] = useState<ReferralPaymentsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('pending')
  const [chainFilter, setChainFilter] = useState<'' | ClaimChain>('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [toggleBusy, setToggleBusy] = useState(false)
  const [rowBusy, setRowBusy] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  const [payClaim, setPayClaim] = useState<ReferralPaymentRow | null>(null)
  const [prep, setPrep] = useState<PreparePayoutResult | null>(null)
  const [payPhase, setPayPhase] = useState<PayPhase>('idle')
  const [txHash, setTxHash] = useState('')
  const [payError, setPayError] = useState<string | null>(null)

  const [rejectClaimRow, setRejectClaimRow] = useState<ReferralPaymentRow | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [m, list] = await Promise.all([
        getPayoutMode(),
        getReferralPayments({
          page,
          status: status || undefined,
          chain: chainFilter || undefined,
          limit: 50,
        }),
      ])
      setMode(m)
      setData(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load claims')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page, status, chainFilter])

  useEffect(() => {
    void load()
  }, [load, reloadKey])

  const refresh = () => setReloadKey((k) => k + 1)

  async function onToggleAuto(enabled: boolean) {
    setToggleBusy(true)
    setActionMsg(null)
    try {
      await setReferralAutoPayout(enabled)
      if (enabled) {
        await processAutoPayouts(20)
        setActionMsg('Auto payout enabled and pending claims swept.')
      } else {
        setActionMsg('Auto payout disabled — new claims stay pending for manual pay.')
      }
      const m = await getPayoutMode()
      setMode(m)
      refresh()
    } catch (err) {
      setActionMsg(claimErrorMessage(err))
    } finally {
      setToggleBusy(false)
    }
  }

  async function onProcessAuto() {
    setToggleBusy(true)
    setActionMsg(null)
    try {
      const result = await processAutoPayouts(20)
      setActionMsg(
        `Process auto: ${result.paid ?? 0} paid / ${result.processed ?? 0} processed.`,
      )
      refresh()
    } catch (err) {
      setActionMsg(claimErrorMessage(err))
    } finally {
      setToggleBusy(false)
    }
  }

  async function openManualPay(claim: ReferralPaymentRow) {
    setPayClaim(claim)
    setPrep(null)
    setTxHash('')
    setPayError(null)
    setPayPhase('preparing')
    try {
      const result = await prepareClaimPayout(claim.id)
      setPrep(result)
      setPayPhase('ready')
    } catch (err) {
      setPayError(claimErrorMessage(err as ClaimActionError))
      setPayPhase('error')
    }
  }

  async function confirmWithRetry(claimId: string, hash: string, attempt = 0): Promise<void> {
    try {
      await confirmClaimPayout(claimId, hash)
      setPayPhase('done')
      refresh()
    } catch (err) {
      const e = err as ClaimActionError
      if (e.reason === 'already_paid') {
        setPayPhase('done')
        refresh()
        return
      }
      if (e.reason === 'tx_verification_failed' && attempt < 2) {
        await new Promise((r) => setTimeout(r, 3000))
        return confirmWithRetry(claimId, hash, attempt + 1)
      }
      throw err
    }
  }

  async function onConfirmPaste() {
    if (!payClaim || !txHash.trim()) return
    setPayError(null)
    setPayPhase('confirming')
    try {
      await confirmWithRetry(payClaim.id, txHash.trim())
    } catch (err) {
      setPayError(claimErrorMessage(err as ClaimActionError))
      setPayPhase('error')
    }
  }

  async function onPoolPay(claim: ReferralPaymentRow) {
    setRowBusy(claim.id)
    setActionMsg(null)
    try {
      await autoPayClaim(claim.id)
      setActionMsg(`Pool payout submitted for ${claim.id} (${claim.chain})`)
      refresh()
    } catch (err) {
      setActionMsg(claimErrorMessage(err))
    } finally {
      setRowBusy(null)
    }
  }

  async function onReject() {
    if (!rejectClaimRow || !rejectReason.trim()) return
    setRowBusy(rejectClaimRow.id)
    try {
      await rejectClaim(rejectClaimRow.id, rejectReason.trim())
      setRejectClaimRow(null)
      setRejectReason('')
      setActionMsg('Claim rejected.')
      refresh()
    } catch (err) {
      setActionMsg(claimErrorMessage(err))
    } finally {
      setRowBusy(null)
    }
  }

  function showManualPay(claim: ReferralPaymentRow) {
    if (claim.status !== 'pending') return false
    if (!mode) return true
    if (mode.mode === 'manual') return true
    return claim.amountSol > mode.autoPayoutMaxSol
  }

  function showPoolPay(claim: ReferralPaymentRow) {
    return claim.status === 'pending' && hasPoolForChain(mode, claim.chain)
  }

  function showReject(claim: ReferralPaymentRow) {
    return claim.status === 'pending'
  }

  return (
    <div>
      <PageHeader
        title="Referral Payments"
        description="Claim v2 ledger — Solana (SOL) and Robinhood (ETH) manual or pool payouts."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onProcessAuto} disabled={toggleBusy}>
              Process auto
            </Button>
            <Button variant="secondary" onClick={refresh}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        }
      />

      {mode && (
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Payout mode</p>
                  <Badge variant={mode.autoPayoutEnabled ? 'success' : 'pending'} dot>
                    {mode.mode.toUpperCase()}
                  </Badge>
                  {mode.dryRun && <Badge variant="warning">DRY RUN</Badge>}
                </div>
                <p className="mt-2 text-sm text-muted">
                  Min {mode.minClaimSol} · Auto max {mode.autoPayoutMaxSol}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant={mode.solana.hasPoolPrivateKey ? 'info' : 'neutral'}>
                    SOL pool {mode.solana.hasPoolPrivateKey ? 'ready' : 'missing'}
                  </Badge>
                  <Badge variant={mode.robinhood.hasPoolPrivateKey ? 'warning' : 'neutral'}>
                    ETH pool {mode.robinhood.hasPoolPrivateKey ? 'ready' : 'missing'}
                  </Badge>
                </div>
                {mode.dryRun && (
                  <p className="mt-2 text-xs text-amber-600">
                    Server dry-run is on — claims may be marked without a real transfer.
                  </p>
                )}
              </div>
              <Switch
                checked={mode.autoPayoutEnabled}
                disabled={toggleBusy}
                onChange={onToggleAuto}
                label="Auto payout"
                description="Server pools pay eligible claims"
              />
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-[13px] text-muted font-medium">Rules</p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
              <li>Claim ≥ {mode.minClaimSol} SOL/ETH and ≤ 0.1% of referred volume</li>
              <li>Auto skips above {mode.autoPayoutMaxSol} → manual wallet</li>
              <li>Pay on the claim chain (Solana or Robinhood), then confirm tx</li>
            </ul>
          </Card>
        </div>
      )}

      {actionMsg && (
        <div className="mb-4 rounded-[14px] border border-border dark:border-border-dark px-4 py-3 text-sm">
          {actionMsg}
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select
          placeholder="All statuses"
          value={status}
          onChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
          options={[
            { label: 'Pending', value: 'pending' },
            { label: 'Paid', value: 'paid' },
            { label: 'Rejected', value: 'rejected' },
            { label: 'Failed', value: 'failed' },
            { label: 'Approved', value: 'approved' },
          ]}
          className="w-44"
        />
        <Select
          placeholder="All chains"
          value={chainFilter}
          onChange={(v) => {
            setChainFilter(v as '' | ClaimChain)
            setPage(1)
          }}
          options={[
            { label: 'Solana', value: 'solana' },
            { label: 'Robinhood', value: 'robinhood' },
          ]}
          className="w-44"
        />
        {data && (
          <p className="text-sm text-muted">
            {data.total} claim{data.total === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {loading ? (
        <SkeletonTable rows={8} />
      ) : error ? (
        <div className="card-surface p-8 max-w-xl">
          <p className="text-sm font-medium text-slate-900 dark:text-white">Failed to load claims</p>
          <p className="mt-1 text-sm text-muted">{error}</p>
          <Button className="mt-4" onClick={refresh}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="card-surface p-10 text-center">
          <p className="text-sm font-medium text-slate-900 dark:text-white">No claims found</p>
          <p className="mt-1 text-sm text-muted">
            {status || chainFilter ? 'Try different filters.' : 'The claim ledger is empty.'}
          </p>
        </div>
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <Th>User</Th>
                <Th>Chain</Th>
                <Th>Amount</Th>
                <Th>Recipient</Th>
                <Th>Status</Th>
                <Th>Tx</Th>
                <Th>Created</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </THead>
            <TBody>
              {data.items.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {p.telegramHandle
                          ? `@${p.telegramHandle.replace(/^@/, '')}`
                          : p.userId || '—'}
                      </p>
                      <p className="text-xs font-mono text-muted">{p.userId}</p>
                      {p.rejectReason && (
                        <p className="mt-1 text-[11px] text-red-500">{p.rejectReason}</p>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <Badge
                      variant={p.chain === 'solana' ? 'info' : 'warning'}
                      className="capitalize"
                    >
                      {p.chain}
                    </Badge>
                  </Td>
                  <Td className="font-semibold">
                    {formatAmount(p.amountSol, p.currency)}
                    {p.amountUsd > 0 && (
                      <span className="ml-1 text-xs font-normal text-muted">
                        · {formatCurrency(p.amountUsd)}
                      </span>
                    )}
                  </Td>
                  <Td>
                    {p.recipientAddress ? (
                      <div>
                        <code className="font-mono text-xs" title={p.recipientAddress}>
                          {shortHash(p.recipientAddress)}
                        </code>
                        {p.recipientSource && (
                          <p className="text-[11px] text-muted capitalize">{p.recipientSource.replace('_', ' ')}</p>
                        )}
                      </div>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td>
                    <Badge
                      variant={statusVariant[p.status.toLowerCase()] ?? 'neutral'}
                      dot
                      className="capitalize"
                    >
                      {p.status}
                    </Badge>
                  </Td>
                  <Td>
                    {p.payoutTxHash ? (
                      <a
                        href={txExplorerUrl(p.chain, p.payoutTxHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-primary-600 hover:text-primary-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {shortHash(p.payoutTxHash)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td>{p.createdAt ? formatRelativeTime(p.createdAt) : '—'}</Td>
                  <Td className="text-right">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {showManualPay(p) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={rowBusy === p.id}
                          onClick={() => openManualPay(p)}
                        >
                          Pay
                        </Button>
                      )}
                      {showPoolPay(p) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={rowBusy === p.id}
                          onClick={() => onPoolPay(p)}
                        >
                          Pool
                        </Button>
                      )}
                      {showReject(p) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={rowBusy === p.id}
                          onClick={() => {
                            setRejectClaimRow(p)
                            setRejectReason('')
                          }}
                        >
                          Reject
                        </Button>
                      )}
                    </div>
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
        open={!!payClaim}
        onClose={() => {
          setPayClaim(null)
          setPrep(null)
          setPayPhase('idle')
          setPayError(null)
        }}
        title="Manual payout"
        description={
          payClaim
            ? `${payClaim.chain} · ${payClaim.currency} · ${payClaim.id}`
            : undefined
        }
        width="max-w-lg"
      >
        {payClaim && (
          <div className="space-y-5">
            {payPhase === 'preparing' && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                Preparing claim… checking eligibility.
              </div>
            )}

            {payError && (
              <div className="rounded-[14px] border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600">
                {payError}
              </div>
            )}

            {prep && (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={prep.chain === 'solana' ? 'info' : 'warning'}
                    className="capitalize"
                  >
                    {prep.chain}
                  </Badge>
                  <Badge variant="neutral">{prep.currency}</Badge>
                  {prep.recipientSource && (
                    <Badge variant="neutral" className="capitalize">
                      {prep.recipientSource.replace('_', ' ')}
                    </Badge>
                  )}
                </div>

                <dl className="space-y-3">
                  {[
                    ['Amount', formatAmount(prep.amountSol, prep.currency)],
                    ['Recipient', prep.recipientAddress],
                    ['Memo', prep.memo || '—'],
                    ['User', prep.userId],
                    [
                      'Units',
                      prep.chain === 'robinhood'
                        ? `${prep.amountWei ?? '—'} wei`
                        : `${prep.amountLamports ?? '—'} lamports`,
                    ],
                  ].map(([k, v]) => (
                    <div key={k} className="border-b border-border dark:border-border-dark pb-3">
                      <dt className="text-xs text-muted">{k}</dt>
                      <dd className="mt-1 text-sm font-medium break-all font-mono text-slate-900 dark:text-white">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>

                {payPhase === 'done' ? (
                  <div className="space-y-3">
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-600 pointer-events-none"
                      disabled
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Successful
                    </Button>
                    <div className="rounded-[14px] border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                      Claim marked paid on {prep.chain}.
                      {txHash && (
                        <a
                          href={txExplorerUrl(prep.chain, txHash)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block font-mono text-xs underline"
                        >
                          {shortHash(txHash)}
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted">
                      {prep.chain === 'robinhood'
                        ? 'Connect a wallet with RainbowKit, switch to Robinhood Chain, then pay.'
                        : 'Connect Phantom or Solflare, then pay SOL from your wallet.'}
                    </p>

                    <ManualWalletPayButton
                      prep={prep}
                      phase={
                        payPhase === 'paying' ||
                        payPhase === 'confirming' ||
                        payPhase === 'error' ||
                        payPhase === 'ready'
                          ? payPhase === 'ready'
                            ? 'idle'
                            : payPhase
                          : 'idle'
                      }
                      onPhase={(p) => setPayPhase(p)}
                      onTxHash={setTxHash}
                      onConfirm={(hash) => confirmWithRetry(prep.claimId, hash)}
                      onError={(msg) => setPayError(msg || null)}
                    />

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted">
                        Or paste {prep.chain === 'robinhood' ? 'tx hash' : 'signature'}
                      </label>
                      <Input
                        value={txHash}
                        onChange={(e) => setTxHash(e.target.value)}
                        disabled={payPhase === 'paying' || payPhase === 'confirming'}
                        placeholder={
                          prep.chain === 'robinhood'
                            ? '0x… Robinhood Chain transaction hash'
                            : 'Solana transaction signature'
                        }
                      />
                      <Button
                        className="w-full"
                        variant="secondary"
                        disabled={
                          !txHash.trim() ||
                          payPhase === 'paying' ||
                          payPhase === 'confirming'
                        }
                        onClick={() => void onConfirmPaste()}
                      >
                        {payPhase === 'confirming' && (
                          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                        )}
                        {payPhase === 'confirming' ? 'Confirming…' : 'Confirm payout'}
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </Drawer>

      <Drawer
        open={!!rejectClaimRow}
        onClose={() => setRejectClaimRow(null)}
        title="Reject claim"
        description={rejectClaimRow?.id}
        width="max-w-md"
      >
        {rejectClaimRow && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Reject {formatAmount(rejectClaimRow.amountSol, rejectClaimRow.currency)} (
              {rejectClaimRow.chain}) for user {rejectClaimRow.userId}.
            </p>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason (required)"
            />
            <Button
              className="w-full"
              variant="danger"
              disabled={!rejectReason.trim() || rowBusy === rejectClaimRow.id}
              onClick={() => void onReject()}
            >
              Reject claim
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  )
}
