"use client";

import { motion } from "framer-motion";

export function KarigarListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          {/* Avatar shimmer */}
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-muted" />

          {/* Text shimmers */}
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>

          {/* Phone shimmer */}
          <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
        </motion.div>
      ))}
    </div>
  );
}
