import Link from "next/link";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  /** If provided, shows a "+ New" action button */
  actionHref?: string;
  actionLabel?: string;
}

export function PageHeader({
  title,
  actionHref,
  actionLabel,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {title}
      </h1>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
