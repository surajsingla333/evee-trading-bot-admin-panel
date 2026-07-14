import { cn } from '@/lib/cn'

export function Table({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('card-surface overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">{children}</table>
      </div>
    </div>
  )
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="sticky top-0 z-10 border-b border-border dark:border-border-dark bg-surface/95 dark:bg-slate-900/95 backdrop-blur-sm">
      {children}
    </thead>
  )
}

export function Th({
  children,
  className,
  sortable,
  onSort,
}: {
  children: React.ReactNode
  className?: string
  sortable?: boolean
  onSort?: () => void
}) {
  return (
    <th
      className={cn(
        'px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400',
        sortable && 'cursor-pointer select-none hover:text-slate-800 dark:hover:text-slate-200',
        className,
      )}
      onClick={sortable ? onSort : undefined}
    >
      {children}
    </th>
  )
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border dark:divide-border-dark">{children}</tbody>
}

export function Tr({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition-colors duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-800/40',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </tr>
  )
}

export function Td({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <td className={cn('px-5 py-4 text-slate-700 dark:text-slate-300 whitespace-nowrap', className)}>
      {children}
    </td>
  )
}

export function TablePagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="flex items-center justify-between border-t border-border dark:border-border-dark px-5 py-3">
      <p className="text-xs text-muted">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 rounded-lg border border-border dark:border-border-dark px-3 text-xs font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-8 rounded-lg border border-border dark:border-border-dark px-3 text-xs font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}
