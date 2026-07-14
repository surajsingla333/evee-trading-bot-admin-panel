import { cn } from '@/lib/cn'
import type { BadgeVariant } from '@/types'

const styles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  warning: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  error: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
  info: 'bg-primary-50 text-primary-700 border-primary-100 dark:bg-primary-500/10 dark:text-primary-300 dark:border-primary-500/20',
  neutral: 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  pending: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20',
}

export function Badge({
  children,
  variant = 'neutral',
  className,
  dot,
}: {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide',
        styles[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-emerald-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'error' && 'bg-red-500',
            variant === 'info' && 'bg-primary-500',
            variant === 'pending' && 'bg-violet-500',
            variant === 'neutral' && 'bg-slate-400',
          )}
        />
      )}
      {children}
    </span>
  )
}
