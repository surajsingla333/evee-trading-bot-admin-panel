import { cn } from '@/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse-soft rounded-xl bg-slate-100 dark:bg-slate-800',
        className,
      )}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="card-surface p-6 space-y-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="border-b border-border dark:border-border-dark px-6 py-4">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="divide-y divide-border dark:divide-border-dark">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24 ml-auto" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
