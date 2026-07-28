"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Layers,
  Scissors,
  Users,
  ShieldCheck,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/shared/FadeIn";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { BatchDetailSkeleton } from "@/components/batches/BatchDetailSkeleton";
import { CuttingLogForm } from "@/components/batches/CuttingLogForm";
import { YieldChart } from "@/components/batches/YieldChart";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { calculateTotalYield } from "@/lib/calculations/yield";

type Tab = "overview" | "cutting" | "assignments" | "quality" | "dispatch";

const tabs: { key: Tab; label: string; icon: typeof Layers }[] = [
  { key: "overview", label: "Overview", icon: Layers },
  { key: "cutting", label: "Cutting", icon: Scissors },
  { key: "assignments", label: "Assignments", icon: Users },
  { key: "quality", label: "Quality", icon: ShieldCheck },
  { key: "dispatch", label: "Dispatch", icon: Truck },
];

interface CuttingLog {
  id: number;
  piecesCut: number;
  fabricUsedMeters: string;
  cuttingDate: string;
  notes: string | null;
}

interface Assignment {
  id: number;
  piecesAssigned: number;
  piecesReturned: number | null;
  dateGiven: string;
  dateCollected: string | null;
  status: string;
  karigar: { id: number; name: string; type: string };
}

interface BatchDetail {
  id: number;
  designName: string;
  color: string;
  garmentType: string;
  fabricReceivedMeters: string;
  ratePerPiece: string;
  totalPiecesPlanned: number | null;
  dateReceived: string;
  status: string;
  merchant: { name: string; id: number };
  cuttingLogs: CuttingLog[];
  assignments: Assignment[];
  qualityChecks: any[];
  dispatches: any[];
}

export default function BatchDetailPage() {
  const params = useParams();
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBatch();
  }, [params.id]);

  async function fetchBatch() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/batches/${params.id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Batch not found");
        throw new Error("Failed to load");
      }
      setBatch(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load batch");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <BatchDetailSkeleton />;

  if (error || !batch) {
    return (
      <FadeIn>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg font-medium text-foreground">
            {error ?? "Batch not found"}
          </p>
          <Link
            href="/batches"
            className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Batches
          </Link>
        </div>
      </FadeIn>
    );
  }

  const yieldPct =
    batch.cuttingLogs.length > 0
      ? calculateTotalYield(batch.cuttingLogs, batch.fabricReceivedMeters)
      : null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/batches"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Batches
      </Link>

      {/* Header */}
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-white",
                batch.garmentType === "kurti" ? "bg-secondary" : "bg-accent"
              )}
            >
              <Layers className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  {batch.designName}
                </h1>
                <StatusBadge status={batch.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {batch.color} · {batch.garmentType} · {batch.merchant.name}
              </p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Quick Stats */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Fabric Received</p>
            <p className="mt-1 font-heading text-lg font-bold tabular-nums text-foreground">
              {batch.fabricReceivedMeters}m
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Rate/piece</p>
            <p className="mt-1 font-heading text-lg font-bold tabular-nums text-foreground">
              {formatCurrency(batch.ratePerPiece)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Cut Pieces</p>
            <p className="mt-1 font-heading text-lg font-bold tabular-nums text-foreground">
              {batch.cuttingLogs.reduce((s, l) => s + l.piecesCut, 0)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Assignments</p>
            <p className="mt-1 font-heading text-lg font-bold tabular-nums text-foreground">
              {batch.assignments.length}
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Tabs */}
      <FadeIn delay={0.1}>
        <div className="flex gap-1 overflow-x-auto border-b border-border">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </FadeIn>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Batch Info
                </h3>
                <dl className="mt-4 space-y-3">
                  {[
                    ["Design", batch.designName],
                    ["Color", batch.color],
                    ["Garment", batch.garmentType],
                    ["Merchant", batch.merchant.name],
                    ["Date Received", formatDate(batch.dateReceived)],
                    [
                      "Planned Pieces",
                      batch.totalPiecesPlanned?.toString() ?? "—",
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="text-sm font-medium text-foreground capitalize">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Production Summary
                </h3>
                <dl className="mt-4 space-y-3">
                  {[
                    [
                      "Total Cut",
                      batch.cuttingLogs.reduce((s, l) => s + l.piecesCut, 0).toString(),
                    ],
                    [
                      "Total Assigned",
                      batch.assignments.reduce(
                        (s, a) => s + a.piecesAssigned,
                        0
                      ).toString(),
                    ],
                    [
                      "Completed",
                      batch.assignments
                        .filter(
                          (a) =>
                            a.status === "completed" || a.status === "paid"
                        )
                        .reduce(
                          (s, a) => s + (a.piecesReturned ?? 0),
                          0
                        ).toString(),
                    ],
                    [
                      "Active Karigars",
                      batch.assignments.filter(
                        (a) => a.status === "in_progress"
                      ).length.toString(),
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="font-heading text-lg font-bold tabular-nums text-foreground">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === "cutting" && (
          <div className="space-y-6">
            {/* Yield Chart */}
            {yieldPct !== null && (
              <YieldChart currentYield={yieldPct} />
            )}

            {/* Cutting Logs Table */}
            {batch.cuttingLogs.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Date
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Pieces Cut
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Fabric Used
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Yield
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {batch.cuttingLogs.map((log) => {
                      const logYield = calculateTotalYield(
                        [log],
                        batch.fabricReceivedMeters
                      );
                      return (
                        <tr
                          key={log.id}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(log.cuttingDate)}
                          </td>
                          <td className="px-4 py-3 text-right font-heading tabular-nums text-foreground">
                            {log.piecesCut}
                          </td>
                          <td className="px-4 py-3 text-right font-heading tabular-nums text-foreground">
                            {log.fabricUsedMeters}m
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-heading tabular-nums text-foreground">
                              {logYield}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {log.notes ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No cutting logs yet"
                description="Record cutting data below to start tracking fabric yield."
              />
            )}

            {/* Add Cutting Log */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <CuttingLogForm
                batchId={batch.id}
                fabricReceivedMeters={parseFloat(batch.fabricReceivedMeters)}
                onSuccess={fetchBatch}
              />
            </div>
          </div>
        )}

        {activeTab === "assignments" && (
          <div>
            {batch.assignments.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Karigar
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Assigned
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Returned
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Given
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Collected
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {batch.assignments.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/karigars/${a.karigar.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {a.karigar.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right font-heading tabular-nums text-foreground">
                          {a.piecesAssigned}
                        </td>
                        <td className="px-4 py-3 text-right font-heading tabular-nums text-foreground">
                          {a.piecesReturned ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(a.dateGiven)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {a.dateCollected
                            ? formatDate(a.dateCollected)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={a.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No assignments yet"
                description="Assign bundles to karigars from the Assignments tab."
              />
            )}
          </div>
        )}

        {activeTab === "quality" && (
          <div>
            {batch.qualityChecks.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Checkpoint
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Checked
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Rejected
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {batch.qualityChecks.map((qc: any) => (
                      <tr
                        key={qc.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 capitalize text-foreground">
                          {qc.checkedBy === "home" ? "Home Check" : "Press Vendor"}
                        </td>
                        <td className="px-4 py-3 text-right font-heading tabular-nums text-foreground">
                          {qc.piecesChecked ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-heading tabular-nums text-destructive">
                          {qc.piecesRejected}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {qc.rejectionReason ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(qc.checkDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No quality checks yet"
                description="QC entries will appear here as you log home and press vendor checks."
              />
            )}
          </div>
        )}

        {activeTab === "dispatch" && (
          <div>
            {batch.dispatches.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Chalan #
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Pieces
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {batch.dispatches.map((d: any) => (
                      <tr
                        key={d.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {d.chalanNumber}
                        </td>
                        <td className="px-4 py-3 text-right font-heading tabular-nums text-foreground">
                          {d.piecesDispatched}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(d.dispatchDate)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {d.notes ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No dispatches yet"
                description="Dispatch entries will appear here when you send finished goods to the merchant."
              />
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
