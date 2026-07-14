import { forwardRef, type InputHTMLAttributes } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-[12px] border border-border dark:border-border-dark bg-white dark:bg-slate-900/50 px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors duration-200 focus-ring hover:border-slate-300 dark:hover:border-slate-600',
        className,
      )}
      {...props}
    />
  ),
)

Input.displayName = 'Input'

export function SearchInput({
  className,
  containerClassName,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { containerClassName?: string }) {
  return (
    <div className={cn('relative', containerClassName)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input className={cn('pl-10', className)} {...props} />
    </div>
  )
}
