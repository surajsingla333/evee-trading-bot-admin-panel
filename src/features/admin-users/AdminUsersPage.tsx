import { motion } from 'framer-motion'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { adminUsers } from '@/data/mock'
import { formatRelativeTime } from '@/lib/format'

export function AdminUsersPage() {
  return (
    <div>
      <PageHeader
        title="Admin Users"
        description="Roles, permissions, and recent operational activity."
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-2">
        {adminUsers.map((admin, i) => (
          <motion.div
            key={admin.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.28 }}
            className="card-surface p-6 hover-elevate"
          >
            <div className="flex items-start gap-4">
              <Avatar initials={admin.avatar} name={admin.name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {admin.name}
                  </h3>
                  <Badge variant="info">{admin.role}</Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted">{admin.email}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[14px] bg-surface dark:bg-slate-800/50 p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-muted">Actions today</p>
                <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                  {admin.actionsToday}
                </p>
              </div>
              <div className="rounded-[14px] bg-surface dark:bg-slate-800/50 p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-muted">Last active</p>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                  {formatRelativeTime(admin.lastActive)}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Permissions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {admin.permissions.map((p) => (
                  <Badge key={p} variant="neutral" className="capitalize">
                    {p.replace('-', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
