import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { hover?: boolean }>(
  ({ className, hover, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'card-surface p-6',
        hover && 'hover-elevate cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
)

Card.displayName = 'Card'

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-5', className)}>
      <div>
        <h3 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h3>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
