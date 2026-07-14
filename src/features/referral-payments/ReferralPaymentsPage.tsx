import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/Table'
import { referralPayments } from '@/data/mock'
import type { ReferralPayment } from '@/types'
import type { BadgeVariant } from '@/types'
import { formatCurrency, formatRelativeTime } from '@/lib/format'

const statusVariant: Record<ReferralPayment['status'], BadgeVariant> = {
  paid: 'success',
  pending: 'pending',
  failed: 'error',
}

export function ReferralPaymentsPage() {
  const [status, setStatus] = useState('')
  const filtered = referralPayments.filter((p) => !status || p.status === status)

  return (
    <div>
      <PageHeader
        title="Referral Payments"
        description="Disbursement history with wallet, hash, and settlement status."
      />

      <div className="mb-5">
        <Select
          placeholder="Status"
          value={status}
          onChange={setStatus}
          options={[
            { label: 'Paid', value: 'paid' },
            { label: 'Pending', value: 'pending' },
            { label: 'Failed', value: 'failed' },
          ]}
          className="w-40"
        />
      </div>

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
          {filtered.map((p) => (
            <Tr key={p.id}>
              <Td className="font-medium text-slate-900 dark:text-white">{p.userName}</Td>
              <Td className="font-semibold">{formatCurrency(p.amount)}</Td>
              <Td>
                <Badge variant={statusVariant[p.status]} dot className="capitalize">
                  {p.status}
                </Badge>
              </Td>
              <Td>
                <code className="font-mono text-xs">{p.wallet}</code>
              </Td>
              <Td>
                <code className="font-mono text-xs text-muted">{p.hash}</code>
              </Td>
              <Td>{formatRelativeTime(p.time)}</Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </div>
  )
}
