import { useMemo, useState } from 'react'
import { MoreHorizontal, Filter } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { SearchInput } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { Table, THead, Th, TBody, Tr, Td, TablePagination } from '@/components/ui/Table'
import { users as mockUsers } from '@/data/mock'
import type { User } from '@/types'
import { formatRelativeTime } from '@/lib/format'
import type { BadgeVariant } from '@/types'

const statusVariant: Record<User['status'], BadgeVariant> = {
  active: 'success',
  inactive: 'neutral',
  suspended: 'error',
}

const tabs = ['Profile', 'Wallets', 'Trades', 'Positions', 'Referrals', 'Statistics'] as const

export function UsersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [referral, setReferral] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<User | null>(null)
  const [tab, setTab] = useState<(typeof tabs)[number]>('Profile')

  const filtered = useMemo(() => {
    return mockUsers.filter((u) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.referralCode.toLowerCase().includes(q)
      const matchStatus = !status || u.status === status
      const matchReferral =
        !referral ||
        (referral === 'yes' && !!u.referredBy) ||
        (referral === 'no' && !u.referredBy)
      return matchSearch && matchStatus && matchReferral
    })
  }, [search, status, referral])

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage platform users, referral codes, and wallet associations."
        actions={
          <Button variant="secondary">
            <Filter className="h-4 w-4" /> Export
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          placeholder="Search name, ID, or referral…"
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
          onChange={setStatus}
          options={[
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Suspended', value: 'suspended' },
          ]}
          className="lg:w-40"
        />
        <Select
          placeholder="Referral"
          value={referral}
          onChange={setReferral}
          options={[
            { label: 'Has referrer', value: 'yes' },
            { label: 'Organic', value: 'no' },
          ]}
          className="lg:w-44"
        />
        <InputDatePlaceholder />
      </div>

      <Table>
        <THead>
          <tr>
            <Th>User</Th>
            <Th>User ID</Th>
            <Th>Referral Code</Th>
            <Th>Status</Th>
            <Th>Wallets</Th>
            <Th>Registered</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </THead>
        <TBody>
          {filtered.map((user) => (
            <Tr key={user.id} onClick={() => { setSelected(user); setTab('Profile') }}>
              <Td>
                <div className="flex items-center gap-3">
                  <Avatar initials={user.avatar} name={user.name} />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-muted">{user.email}</p>
                  </div>
                </div>
              </Td>
              <Td>
                <code className="text-xs font-mono text-slate-600 dark:text-slate-400">{user.id}</code>
              </Td>
              <Td>
                <code className="rounded-lg bg-surface dark:bg-slate-800 px-2 py-1 text-xs font-medium">
                  {user.referralCode}
                </code>
              </Td>
              <Td>
                <Badge variant={statusVariant[user.status]} dot className="capitalize">
                  {user.status}
                </Badge>
              </Td>
              <Td>{user.walletCount}</Td>
              <Td>{formatRelativeTime(user.registeredAt)}</Td>
              <Td className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelected(user)
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
      <div className="mt-0">
        <div className="card-surface mt-0 rounded-t-none border-t-0">
          <TablePagination page={page} totalPages={Math.max(1, Math.ceil(filtered.length / 8))} onPageChange={setPage} />
        </div>
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        description={selected?.email}
        width="max-w-xl"
      >
        {selected && (
          <div>
            <div className="flex flex-wrap gap-1 p-1 rounded-[14px] bg-surface dark:bg-slate-800/60 mb-6">
              {tabs.map((t) => (
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
                </button>
              ))}
            </div>

            {tab === 'Profile' && (
              <dl className="space-y-4">
                {[
                  ['User ID', selected.id],
                  ['Referral Code', selected.referralCode],
                  ['Status', selected.status],
                  ['Referred By', selected.referredBy ?? 'Organic'],
                  ['Wallets', String(selected.walletCount)],
                  ['Registered', new Date(selected.registeredAt).toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-border dark:border-border-dark pb-3">
                    <dt className="text-sm text-muted">{k}</dt>
                    <dd className="text-sm font-medium text-slate-900 dark:text-white capitalize">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            {tab !== 'Profile' && (
              <div className="rounded-[16px] border border-dashed border-border dark:border-border-dark p-8 text-center">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{tab}</p>
                <p className="mt-1 text-sm text-muted">
                  Detailed {tab.toLowerCase()} for {selected.name} will load from the API.
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

function InputDatePlaceholder() {
  return (
    <input
      type="date"
      className="h-10 rounded-[12px] border border-border dark:border-border-dark bg-white dark:bg-slate-900/50 px-3.5 text-sm text-slate-700 dark:text-slate-300 focus-ring lg:w-44"
      aria-label="Date range"
    />
  )
}
