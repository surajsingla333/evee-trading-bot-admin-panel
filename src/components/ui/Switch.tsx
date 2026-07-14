import { cn } from '@/lib/cn'

export function Switch({
  checked,
  onChange,
  disabled,
  label,
  description,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  description?: string
}) {
  return (
    <label className={cn('flex items-start gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-250 ease-out focus-ring',
          checked ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-250 ease-out',
            checked && 'translate-x-5',
          )}
        />
      </button>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-medium text-slate-900 dark:text-white">{label}</span>}
          {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
        </span>
      )}
    </label>
  )
}
