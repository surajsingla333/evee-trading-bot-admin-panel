import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { AreaTrendChart } from '@/components/charts/AreaTrendChart'
import { referralGrowthChart, referrals } from '@/data/mock'
import { formatCurrency } from '@/lib/format'

export function ReferralsPage() {
  const pending = referrals.reduce((s, r) => s + r.pendingRewards, 0)
  const paid = referrals.reduce((s, r) => s + r.paidRewards, 0)

  return (
    <div>
      <PageHeader
        title="Referrals"
        description="Commission analytics, reward pipelines, and referral tree performance."
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card className="p-5">
          <p className="text-[13px] text-muted font-medium">Pending Rewards</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600">{formatCurrency(pending)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] text-muted font-medium">Paid Rewards</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{formatCurrency(paid)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] text-muted font-medium">Active Referrers</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {referrals.filter((r) => r.status === 'active').length}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 mb-6">
        <Card className="lg:col-span-3">
          <CardHeader title="Commission Charts" description="Referral revenue over 30 days" />
          <AreaTrendChart data={referralGrowthChart} format="currency" height={260} />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Referral Tree" description="Top codes by depth" />
          <ul className="space-y-3">
            {referrals
              .slice()
              .sort((a, b) => b.referrals - a.referrals)
              .map((r) => (
                <li
                  key={r.id}
                  className="rounded-[14px] border border-border dark:border-border-dark p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {r.userName}
                      </p>
                      <code className="text-[11px] text-muted">{r.code}</code>
                    </div>
                    <Badge variant={r.status === 'active' ? 'success' : 'neutral'} className="capitalize">
                      L{r.level}
                    </Badge>
                  </div>
                  <div className="mt-3 flex gap-4 text-xs text-muted">
                    <span>{r.referrals} referrals</span>
                    <span>{formatCurrency(r.pendingRewards)} pending</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-primary-600"
                      style={{ width: `${Math.min(100, r.level * 25)}%` }}
                    />
                  </div>
                </li>
              ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="User Detail" description="History · Levels · Payout timeline" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm text-left">
            <thead>
              <tr className="border-b border-border dark:border-border-dark text-[11px] uppercase tracking-wider text-muted">
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Code</th>
                <th className="pb-3 font-semibold">Level</th>
                <th className="pb-3 font-semibold">Referrals</th>
                <th className="pb-3 font-semibold">Pending</th>
                <th className="pb-3 font-semibold">Paid</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border-dark">
              {referrals.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="py-3.5 font-medium text-slate-900 dark:text-white">{r.userName}</td>
                  <td className="py-3.5 font-mono text-xs">{r.code}</td>
                  <td className="py-3.5">{r.level}</td>
                  <td className="py-3.5">{r.referrals}</td>
                  <td className="py-3.5 text-amber-600 font-medium">{formatCurrency(r.pendingRewards)}</td>
                  <td className="py-3.5 text-emerald-600 font-medium">{formatCurrency(r.paidRewards)}</td>
                  <td className="py-3.5">
                    <Badge variant={r.status === 'active' ? 'success' : 'neutral'} dot className="capitalize">
                      {r.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
