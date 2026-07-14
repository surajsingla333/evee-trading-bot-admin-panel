import { cn } from '@/lib/cn'

export function Avatar({
  name,
  initials,
  size = 'md',
  className,
}: {
  name?: string
  initials: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = {
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-12 w-12 text-sm',
  }

  return (
    <div
      title={name}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 font-semibold text-white shadow-soft',
        sizes[size],
        className,
      )}
    >
      {initials}
    </div>
  )
}
