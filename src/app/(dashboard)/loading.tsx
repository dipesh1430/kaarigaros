import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Title shimmer */}
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-4 w-64 animate-pulse rounded bg-muted" />

      {/* KPI cards shimmer */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-8 w-20 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
