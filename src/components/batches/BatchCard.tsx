"use client";

import { motion } from "framer-motion";
import { Shirt, Layers } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";

interface BatchCardProps {
  id: number;
  designName: string;
  color: string;
  colors?: { id: number; color: string }[];
  garmentType: string;
  status: string;
  dateReceived: string;
}

export function BatchCard({
  id,
  designName,
  color,
  colors,
  garmentType,
  status,
  dateReceived,
}: BatchCardProps) {
  const allColors = colors?.filter((c) => c.color !== color).map((c) => c.color) ?? [];
  const displayColors = [color, ...allColors];
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
      }}
    >
      <Link
        href={`/batches/${id}`}
        className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
      >
        {/* Color dot */}
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
          style={{
            backgroundColor:
              garmentType === "kurti" ? "#1E4B4A" : "#9D174D",
          }}
        >
          <Shirt className="h-6 w-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {designName}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            {displayColors.map((c) => (
              <span
                key={c}
                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {c}
              </span>
            ))}
            <span className="text-muted-foreground">·</span>
            <span className="capitalize text-muted-foreground">{garmentType}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{formatDate(dateReceived)}</span>
          </div>
        </div>

        <StatusBadge status={status} />
      </Link>
    </motion.div>
  );
}
