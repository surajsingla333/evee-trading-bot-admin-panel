import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Sun,
} from 'lucide-react'
import { breadcrumbLabels } from '@/config/navigation'
import { useSidebar } from '@/hooks/useSidebar'
import { useTheme } from '@/hooks/useTheme'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export function TopNav() {
  const { theme, toggleTheme } = useTheme()
  const { collapsed, setMobileOpen } = useSidebar()
  const location = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const segments = location.pathname.split('/').filter(Boolean)
  const crumbs = [
    { label: 'Home', href: '/' },
    ...segments.map((seg, i) => ({
      label: breadcrumbLabels[seg] ?? seg,
      href: '/' + segments.slice(0, i + 1).join('/'),
    })),
  ]

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-20 border-b border-border dark:border-border-dark bg-white/80 dark:bg-[#0B1220]/80 backdrop-blur-xl',
        'transition-[margin] duration-280 ease-out',
      )}
      style={{ marginLeft: undefined }}
    >
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <nav className="hidden md:flex items-center gap-1.5 text-sm min-w-0">
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
              <Link
                to={c.href}
                className={cn(
                  'truncate transition-colors',
                  i === crumbs.length - 1
                    ? 'font-medium text-slate-900 dark:text-white'
                    : 'text-muted hover:text-slate-700 dark:hover:text-slate-200',
                )}
              >
                {c.label}
              </Link>
            </span>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotifOpen((o) => !o)}
              aria-label="Notifications"
              className="relative"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary-600 ring-2 ring-white dark:ring-[#0B1220]" />
            </Button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-[16px] border border-border dark:border-border-dark bg-white dark:bg-slate-900 shadow-elevated p-2 animate-fade-in">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Notifications
                </p>
                {[
                  { t: 'Trade filled', d: 'ETH buy of 12.4 completed', time: '12m' },
                  { t: 'Risk alert', d: 'Hot Ops wallet locked', time: '1h' },
                  { t: 'Payout ready', d: 'Referral payment queued', time: '3h' },
                ].map((n) => (
                  <button
                    key={n.t}
                    type="button"
                    className="w-full rounded-[12px] px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{n.t}</p>
                      <span className="text-[11px] text-muted">{n.time}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{n.d}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 rounded-[12px] py-1.5 pl-1.5 pr-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-ring"
            >
              <Avatar initials="AD" name="Admin" size="sm" />
              <span className="hidden sm:block text-sm font-medium text-slate-800 dark:text-slate-200">
                Admin
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-[16px] border border-border dark:border-border-dark bg-white dark:bg-slate-900 shadow-elevated p-1.5 animate-fade-in">
                <div className="px-3 py-2.5 border-b border-border dark:border-border-dark mb-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Admin</p>
                  <p className="text-xs text-muted">admin@evee</p>
                </div>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* collapsed offset hint for layout - used via parent */}
      <span className="sr-only">{collapsed ? 'collapsed' : 'expanded'}</span>
    </header>
  )
}
