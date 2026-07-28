"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface YieldChartProps {
  currentYield: number;
  historicalAverage?: number;
}

export function YieldChart({
  currentYield,
  historicalAverage,
}: YieldChartProps) {
  const diff =
    historicalAverage != null ? currentYield - historicalAverage : null;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Fabric Yield
      </h3>
      <div className="mt-3 flex items-end gap-3">
        <span className="font-heading text-4xl font-bold tabular-nums text-foreground">
          {currentYield}%
        </span>
        {diff !== null && (
          <span
            className={`mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              diff >= 0
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {diff >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {diff >= 0 ? "+" : ""}
            {diff.toFixed(1)}% vs avg
          </span>
        )}
      </div>

      {/* Visual bar */}
      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(currentYield, 100)}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className={`h-full rounded-full ${
            currentYield > 90
              ? "bg-success"
              : currentYield > 70
                ? "bg-warning"
                : "bg-destructive"
          }`}
        />
      </div>
    </div>
  );
}
