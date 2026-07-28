import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function KarigarsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Karigars"
        actionHref="/karigars/new"
        actionLabel="Add Karigar"
      />
      <EmptyState
        title="No karigars yet"
        description="Add your first karigar to start tracking assignments and settlements."
        actionHref="/karigars/new"
        actionLabel="Add First Karigar"
      />
    </div>
  );
}
