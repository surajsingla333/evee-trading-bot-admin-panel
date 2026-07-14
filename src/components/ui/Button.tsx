import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const variants = {
  primary:
    'bg-primary-600 text-white shadow-soft hover:bg-primary-700 hover:shadow-elevated active:bg-primary-800',
  secondary:
    'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-border dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300',
  ghost:
    'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  danger:
    'bg-danger text-white shadow-soft hover:bg-red-600 hover:shadow-elevated',
} as const

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-[12px]',
  lg: 'h-11 px-5 text-sm gap-2 rounded-[12px]',
  icon: 'h-10 w-10 rounded-[12px] justify-center',
} as const

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        'inline-flex items-center font-medium transition-all duration-250 ease-out focus-ring disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
)

Button.displayName = 'Button'
