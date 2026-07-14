import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronsLeft, ChevronsRight, X } from 'lucide-react'
import { navigation } from '@/config/navigation'
import { useSidebar } from '@/hooks/useSidebar'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'

export function Sidebar() {
  const { collapsed, mobileOpen, toggleCollapsed, setMobileOpen } = useSidebar()

  const content = (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex h-16 items-center border-b border-border dark:border-border-dark px-4',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
          <img
            src="/stack.png"
            alt="Stack"
            className="h-20 w-15  object-cover "
          />
          {!collapsed && (
            <div>
              <p className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white leading-none">
                Stack
              </p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                Admin
              </p>
            </div>
          )}
        </div>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex h-8 w-8"
            onClick={toggleCollapsed}
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navigation.map((item, index) => {
          const showSection =
            item.section &&
            (!collapsed) &&
            (index === 0 || navigation[index - 1]?.section !== item.section)

          return (
            <div key={item.href}>
              {showSection && (
                <p className="mb-2 mt-4 first:mt-0 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {item.section}
                </p>
              )}
              <NavLink
                to={item.href}
                end={item.href === '/'}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-indicator"
                        className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary-600"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <item.icon
                      className={cn(
                        'h-[18px] w-[18px] shrink-0 stroke-[1.75]',
                        isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300',
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            </div>
          )
        })}
      </nav>

      {collapsed && (
        <div className="hidden lg:flex border-t border-border dark:border-border-dark p-3 justify-center">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleCollapsed}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {!collapsed && (
        <div className="border-t border-border dark:border-border-dark p-4">
          <div className="rounded-[14px] bg-gradient-to-br from-primary-50 to-white dark:from-primary-500/10 dark:to-slate-900 border border-primary-100/60 dark:border-primary-500/10 p-3.5">
            <p className="text-xs font-semibold text-slate-900 dark:text-white">Stack Pro</p>
            <p className="mt-1 text-[11px] text-muted leading-relaxed">
              Enterprise controls for crypto ops teams.
            </p>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <motion.aside
        className="fixed left-0 top-0 z-30 hidden h-screen border-r border-border dark:border-border-dark bg-white/90 dark:bg-[#0B1220]/95 backdrop-blur-xl lg:block"
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {content}
      </motion.aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[280px] bg-white dark:bg-[#0B1220] shadow-elevated">
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
