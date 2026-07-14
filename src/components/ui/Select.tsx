import { cn } from '@/lib/cn'

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  className,
}: {
  options: { label: string; value: string }[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-10 appearance-none rounded-[12px] border border-border dark:border-border-dark bg-white dark:bg-slate-900/50 px-3.5 pr-9 text-sm text-slate-900 dark:text-slate-100 transition-colors duration-200 focus-ring hover:border-slate-300 dark:hover:border-slate-600 bg-[length:16px] bg-[right_12px_center] bg-no-repeat',
        className,
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E")`,
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
