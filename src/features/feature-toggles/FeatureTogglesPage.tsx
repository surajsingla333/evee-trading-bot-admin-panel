import { useState } from 'react'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/ui/PageHeader'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { featureToggles as initial } from '@/data/mock'
import type { FeatureToggle } from '@/types'
import { formatRelativeTime } from '@/lib/format'

export function FeatureTogglesPage() {
  const [toggles, setToggles] = useState<FeatureToggle[]>(initial)

  const update = (id: string, enabled: boolean) => {
    setToggles((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, enabled, updatedAt: new Date().toISOString(), updatedBy: 'Alex Rivera' }
          : t,
      ),
    )
  }

  const categories = [...new Set(toggles.map((t) => t.category))]

  return (
    <div>
      <PageHeader
        title="Feature Toggles"
        description="Runtime flags with ownership, audit trail, and instant rollout control."
      />

      <div className="space-y-8">
        {categories.map((cat) => (
          <section key={cat}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              {cat}
            </h2>
            <div className="space-y-3">
              {toggles
                .filter((t) => t.category === cat)
                .map((toggle, i) => (
                  <motion.div
                    key={toggle.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.25 }}
                    className="card-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {toggle.name}
                        </h3>
                        <Badge variant={toggle.enabled ? 'success' : 'neutral'} dot>
                          {toggle.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted max-w-xl">{toggle.description}</p>
                      <p className="mt-2 text-[11px] text-muted">
                        Updated by {toggle.updatedBy} · {formatRelativeTime(toggle.updatedAt)}
                      </p>
                    </div>
                    <Switch
                      checked={toggle.enabled}
                      onChange={(v) => update(toggle.id, v)}
                    />
                  </motion.div>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
