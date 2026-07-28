import { cn } from "@/lib/utils";
import { STATUS_COLORS, type BatchStatus } from "@/types";

interface StatusBadgeProps {
  status: BatchStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass =
    STATUS_COLORS[status as BatchStatus] ?? "bg-stone-200 text-stone-700";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        colorClass,
        className
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}
