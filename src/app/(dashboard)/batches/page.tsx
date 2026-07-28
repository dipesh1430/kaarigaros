import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function BatchesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches"
        actionHref="/batches/new"
        actionLabel="New Batch"
      />
      <EmptyState
        title="No batches yet"
        description="Create your first batch to start tracking fabric, cutting, and karigar assignments."
        actionHref="/batches/new"
        actionLabel="Create First Batch"
      />
    </div>
  );
}
