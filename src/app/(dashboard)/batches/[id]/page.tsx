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
import { AssignmentForm } from "@/components/assignments/AssignmentForm";
import { MarkReturnedSheet } from "@/components/assignments/MarkReturnedSheet";
import { QualityCheckForm } from "@/components/quality/QualityCheckForm";
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
          <div className="space-y-6">
            {/* Assignments Header + Action */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {batch.assignments.filter((a) => a.status === "in_progress").length} in progress
                  {" · "}
                  {batch.assignments.filter((a) => a.status === "completed" || a.status === "paid").length} completed
                </p>
              </div>
              <AssignmentForm
                batchId={batch.id}
                onSuccess={fetchBatch}
              />
            </div>

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
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Action
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
                          <span className="ml-1.5 text-xs text-muted-foreground capitalize">
                            ({a.karigar.type})
                          </span>
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
                        <td className="px-4 py-3 text-right">
                          {a.status === "in_progress" && (
                            <MarkReturnedSheet
                              assignmentId={a.id}
                              karigarName={a.karigar.name}
                              piecesAssigned={a.piecesAssigned}
                              onSuccess={fetchBatch}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No assignments yet"
                description="Assign bundles to karigars to start tracking their work on this batch."
              />
            )}
          </div>
        )}

        {activeTab === "quality" && (
          <div className="space-y-8">
            {/* Home QC Section */}
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="border-b border-border bg-amber-50/50 px-6 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                    <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <h3 className="font-heading font-semibold text-foreground">Home Check</h3>
                  <span className="text-xs text-muted-foreground">— visual inspection before pressing</span>
                </div>
              </div>
              <div className="p-6">
                {/* Home QC entries */}
                {batch.qualityChecks.filter((qc: any) => qc.checkedBy === "home").length > 0 ? (
                  <div className="mb-4 overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Checked</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rejected</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rate</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reason</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batch.qualityChecks.filter((qc: any) => qc.checkedBy === "home").map((qc: any) => {
                          const rate = qc.piecesChecked
                            ? Math.round((qc.piecesRejected / qc.piecesChecked) * 100)
                            : null;
                          return (
                            <tr key={qc.id} className="border-b border-border last:border-0">
                              <td className="px-4 py-2.5 font-heading tabular-nums text-foreground">{qc.piecesChecked}</td>
                              <td className="px-4 py-2.5 text-right font-heading tabular-nums text-destructive">{qc.piecesRejected}</td>
                              <td className="px-4 py-2.5 text-right">
                                {rate !== null && (
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    rate > 10 ? "bg-red-100 text-red-700" : rate > 5 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                                  }`}>
                                    {rate}%
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-muted-foreground">{qc.rejectionReason ?? "—"}</td>
                              <td className="px-4 py-2.5 text-muted-foreground">{formatDate(qc.checkDate)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mb-4 text-sm text-muted-foreground">No home check recorded yet.</p>
                )}

                {/* Home QC Form — only show if batch is in right status */}
                {(batch.status === "stitching" || batch.status === "interlock") && (
                  <QualityCheckForm
                    batchId={batch.id}
                    currentStatus={batch.status}
                    onSuccess={fetchBatch}
                    defaultCheckpoint="home"
                  />
                )}
              </div>
            </div>

            {/* Press Vendor QC Section */}
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="border-b border-border bg-rose-50/50 px-6 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100">
                    <svg className="h-4 w-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <h3 className="font-heading font-semibold text-foreground">Press Vendor Check</h3>
                  <span className="text-xs text-muted-foreground">— formal QC before pressing</span>
                </div>
              </div>
              <div className="p-6">
                {/* Press QC entries */}
                {batch.qualityChecks.filter((qc: any) => qc.checkedBy === "press_vendor").length > 0 ? (
                  <div className="mb-4 overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Checked</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rejected</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rate</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reason</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batch.qualityChecks.filter((qc: any) => qc.checkedBy === "press_vendor").map((qc: any) => {
                          const rate = qc.piecesChecked
                            ? Math.round((qc.piecesRejected / qc.piecesChecked) * 100)
                            : null;
                          return (
                            <tr key={qc.id} className="border-b border-border last:border-0">
                              <td className="px-4 py-2.5 font-heading tabular-nums text-foreground">{qc.piecesChecked}</td>
                              <td className="px-4 py-2.5 text-right font-heading tabular-nums text-destructive">{qc.piecesRejected}</td>
                              <td className="px-4 py-2.5 text-right">
                                {rate !== null && (
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    rate > 10 ? "bg-red-100 text-red-700" : rate > 5 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                                  }`}>
                                    {rate}%
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-muted-foreground">{qc.rejectionReason ?? "—"}</td>
                              <td className="px-4 py-2.5 text-muted-foreground">{formatDate(qc.checkDate)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mb-4 text-sm text-muted-foreground">No press vendor check yet.</p>
                )}

                {/* Press QC Form — only show if batch is at press stage */}
                {batch.status === "press" && (
                  <QualityCheckForm
                    batchId={batch.id}
                    currentStatus={batch.status}
                    onSuccess={fetchBatch}
                    defaultCheckpoint="press_vendor"
                  />
                )}
              </div>
            </div>
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
