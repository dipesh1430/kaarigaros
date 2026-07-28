import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function SettlementsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settlements"
        actionHref="/settlements/new"
        actionLabel="New Settlement"
      />
      <EmptyState
        title="No settlements yet"
        description="Settlements will appear here after you process karigar payments."
        actionHref="/settlements/new"
        actionLabel="Start Settlement"
      />
    </div>
  );
}
