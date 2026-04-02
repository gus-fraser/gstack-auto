export function SkeletonLine({ width = 'w-full' }: { width?: string }) {
  return <div className={`h-4 ${width} animate-pulse rounded bg-surface-raised`} />
}

export function SkeletonCard() {
  return (
    <div className="rounded-md border border-border bg-surface p-6">
      <div className="h-8 w-32 animate-pulse rounded bg-surface-raised" />
      <div className="mt-2 h-4 w-20 animate-pulse rounded bg-surface-raised" />
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="rounded-md border border-border bg-surface p-6">
      <div className="h-5 w-32 animate-pulse rounded bg-surface-raised" />
      <div className="mt-4 h-[280px] animate-pulse rounded bg-surface-raised" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 border-b border-border pb-2">
        <div className="h-4 w-24 animate-pulse rounded bg-surface-raised" />
        <div className="h-4 w-32 animate-pulse rounded bg-surface-raised" />
        <div className="h-4 w-20 animate-pulse rounded bg-surface-raised" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2">
          <div className="h-4 w-24 animate-pulse rounded bg-surface-raised" />
          <div className="h-4 w-32 animate-pulse rounded bg-surface-raised" />
          <div className="h-4 w-20 animate-pulse rounded bg-surface-raised" />
        </div>
      ))}
    </div>
  )
}
