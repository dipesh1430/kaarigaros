export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome to KaarigarOS — your garment unit at a glance.
          </p>
        </div>
      </div>

      {/* KPI Cards — placeholder, will be built in Phase 9 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Active Batches
          </p>
          <p className="mt-2 text-3xl font-heading font-bold tabular-nums text-foreground">
            —
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Pending Dispatches
          </p>
          <p className="mt-2 text-3xl font-heading font-bold tabular-nums text-foreground">
            —
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Payable to Karigars
          </p>
          <p className="mt-2 text-3xl font-heading font-bold tabular-nums text-primary">
            ₹ —
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Receivable from Merchant
          </p>
          <p className="mt-2 text-3xl font-heading font-bold tabular-nums text-success">
            ₹ —
          </p>
        </div>
      </div>
    </div>
  );
}
