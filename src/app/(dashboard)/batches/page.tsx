"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FadeIn } from "@/components/shared/FadeIn";
import { StaggerList, StaggerItem } from "@/components/shared/StaggerList";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { BatchFormSheet } from "@/components/batches/BatchFormSheet";
import { BatchCard } from "@/components/batches/BatchCard";
import { BatchListSkeleton } from "@/components/batches/BatchListSkeleton";
import { calculateTotalYield } from "@/lib/calculations/yield";
import { formatDate } from "@/lib/utils";
import {
  Layers,
  LayoutGrid,
  Kanban,
  Shirt,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";

interface BatchData {
  id: number;
  designName: string;
  color: string;
  garmentType: string;
  fabricReceivedMeters: string;
  ratePerPiece: string;
  status: string;
  dateReceived: string;
  merchant: { name: string };
  cuttingLogs: { fabricUsedMeters: string }[];
  _count: { assignments: number };
}

const STATUS_COLUMNS = [
  "received",
  "cutting",
  "stitching",
  "interlock",
  "press",
  "ready",
  "dispatched",
  "billed",
] as const;

type ViewMode = "table" | "pipeline";

export default function BatchesPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("table");

  useEffect(() => {
    fetchBatches();
  }, []);

  async function fetchBatches() {
    try {
      const res = await fetch("/api/batches");
      if (res.ok) {
        setBatches(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch batches:", error);
    } finally {
      setLoading(false);
    }
  }

  const MERCHANT_ID = 1; // Laxmi Krupa Creation (single-merchant MVP)

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Batches
            </h1>
            <p className="text-sm text-muted-foreground">
              Track garment production from fabric to dispatch
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border border-border bg-card p-0.5 shadow-sm">
              <button
                onClick={() => setView("table")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  view === "table"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Table
              </button>
              <button
                onClick={() => setView("pipeline")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  view === "pipeline"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Kanban className="h-3.5 w-3.5" />
                Pipeline
              </button>
            </div>
            <BatchFormSheet
              merchantId={MERCHANT_ID}
              onSuccess={fetchBatches}
            />
          </div>
        </div>
      </FadeIn>

      {/* Loading State */}
      {loading && <BatchListSkeleton />}

      {/* Empty State */}
      {!loading && batches.length === 0 && (
        <FadeIn>
          <EmptyState
            title="No batches yet"
            description="Create your first batch to start tracking fabric, cutting, and karigar assignments."
            actionLabel="Create First Batch"
          />
        </FadeIn>
      )}

      {/* Table View */}
      {!loading && batches.length > 0 && view === "table" && (
        <FadeIn delay={0.1}>
          <div className="hidden sm:block overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Design
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Color
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Yield
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Assignments
                  </th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b, idx) => {
                  const yieldPct =
                    b.cuttingLogs.length > 0
                      ? calculateTotalYield(
                          b.cuttingLogs,
                          b.fabricReceivedMeters
                        )
                      : null;

                  return (
                    <motion.tr
                      key={b.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.2 }}
                      className="border-b border-border last:border-0 transition-colors hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/batches/${b.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-white">
                            <Shirt className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-foreground">
                            {b.designName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {b.color}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(b.dateReceived)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {yieldPct !== null ? (
                          <span className="inline-flex items-center gap-1 font-heading tabular-nums text-sm">
                            <TrendingUp className="h-3.5 w-3.5 text-success" />
                            {yieldPct}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-heading tabular-nums text-muted-foreground">
                        {b._count.assignments}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden">
            <StaggerList className="space-y-3">
              {batches.map((b) => (
                <StaggerItem key={b.id}>
                  <BatchCard
                    id={b.id}
                    designName={b.designName}
                    color={b.color}
                    garmentType={b.garmentType}
                    status={b.status}
                    dateReceived={b.dateReceived}
                  />
                </StaggerItem>
              ))}
            </StaggerList>
          </div>
        </FadeIn>
      )}

      {/* Pipeline View */}
      {!loading && batches.length > 0 && view === "pipeline" && (
        <FadeIn delay={0.1}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUS_COLUMNS.map((status) => {
              const statusBatches = batches.filter(
                (b) => b.status === status
              );

              return (
                <div
                  key={status}
                  className="flex w-64 shrink-0 flex-col"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <StatusBadge status={status} />
                    <span className="text-xs text-muted-foreground">
                      {statusBatches.length}
                    </span>
                  </div>
                  <div className="space-y-2 rounded-xl bg-muted/30 p-2">
                    {statusBatches.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                        No batches
                      </div>
                    )}
                    {statusBatches.map((b) => (
                      <motion.div
                        key={b.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-lg border border-border bg-card p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
                        onClick={() => router.push(`/batches/${b.id}`)}
                      >
                        <p className="truncate text-sm font-medium text-foreground">
                          {b.designName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {b.color} · {formatDate(b.dateReceived)}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </FadeIn>
      )}
    </div>
  );
}
