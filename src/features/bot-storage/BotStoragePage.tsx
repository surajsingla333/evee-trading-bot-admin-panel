import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/Input'
import { botStorage } from '@/data/mock'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'

export function BotStoragePage() {
  const [search, setSearch] = useState('')
  const [openKey, setOpenKey] = useState<string | null>(botStorage[0]?.key ?? null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return botStorage.filter(
      (item) =>
        !q ||
        item.key.toLowerCase().includes(q) ||
        JSON.stringify(item.value).toLowerCase().includes(q),
    )
  }, [search])

  return (
    <div>
      <PageHeader
        title="Bot Storage"
        description="Developer-focused key-value inspector with syntax-highlighted JSON."
      />

      <SearchInput
        placeholder="Search keys or values…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        containerClassName="mb-5 max-w-md"
      />

      <div className="space-y-3">
        {filtered.map((item) => {
          const open = openKey === item.key
          return (
            <div key={item.key} className="card-surface overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenKey(open ? null : item.key)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <ChevronRight
                  className={cn(
                    'h-4 w-4 text-slate-400 transition-transform duration-250',
                    open && 'rotate-90',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <code className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                    {item.key}
                  </code>
                  <p className="mt-0.5 text-xs text-muted">
                    Updated {formatRelativeTime(item.updatedAt)} · {item.size}
                  </p>
                </div>
              </button>
              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <pre className="border-t border-border dark:border-border-dark bg-[#0B1220] text-[13px] leading-relaxed p-5 overflow-x-auto">
                      <JsonHighlight value={item.value} />
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function JsonHighlight({ value }: { value: Record<string, unknown> }) {
  const json = JSON.stringify(value, null, 2)
  const highlighted = json
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
      let cls = 'text-amber-300'
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'text-sky-300' : 'text-emerald-300'
      } else if (/true|false/.test(match)) {
        cls = 'text-violet-300'
      } else if (/null/.test(match)) {
        cls = 'text-slate-500'
      }
      return `<span class="${cls}">${match}</span>`
    })

  return <code className="text-slate-300" dangerouslySetInnerHTML={{ __html: highlighted }} />
}
