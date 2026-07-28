export default function BatchDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />

      <div className="flex items-center gap-4">
        <div className="h-16 w-16 animate-pulse rounded-xl bg-muted" />
        <div className="space-y-2">
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-6 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b border-border pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-20 animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}
