import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        actionHref="/billing/new"
        actionLabel="New Billing"
      />
      <EmptyState
        title="No billing records yet"
        description="Create merchant billing entries from dispatched batches."
        actionHref="/billing/new"
        actionLabel="Create First Billing"
      />
    </div>
  );
}
