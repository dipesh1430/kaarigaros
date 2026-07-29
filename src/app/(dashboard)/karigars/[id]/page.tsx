"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Phone,
  UserCheck,
  UserX,
  Package,
  Wallet,
  BookOpen,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/shared/FadeIn";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { KarigarDetailSkeleton } from "@/components/karigars/KarigarDetailSkeleton";
import { KarigarFormSheet } from "@/components/karigars/KarigarFormSheet";
import { WithdrawalForm } from "@/components/karigars/WithdrawalForm";
import { SetPinForm } from "@/components/karigars/SetPinForm";
import { KarigarRates } from "@/components/karigars/KarigarRates";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AssignmentData {
  id: number;
  piecesAssigned: number;
  piecesReturned: number | null;
  dateGiven: string;
  dateCollected: string | null;
  status: string;
  batch: {
    designName: string;
    color: string;
    ratePerPiece: string;
  };
}

interface LedgerEntryData {
  id: number;
  entryDate: string;
  entryType: "withdrawal" | "rounding_carry";
  amount: string;
  notes: string | null;
}

interface SettlementData {
  id: number;
  settlementDate: string;
  netPayable: string;
  amountPaid: string;
  roundingDiff: string;
  paymentMode: string;
}

interface KarigarFull {
  id: number;
  name: string;
  type: "stitching" | "button";
  gender: string | null;
  phone: string;
  active: boolean;
  selfPickup: boolean;
  hasPin: boolean;
  assignments: AssignmentData[];
  ledgerEntries: LedgerEntryData[];
  settlements: SettlementData[];
}

type Tab = "overview" | "assignments" | "ledger";

const tabs: { key: Tab; label: string; icon: typeof Package }[] = [
  { key: "overview", label: "Overview", icon: BookOpen },
  { key: "assignments", label: "Assignments", icon: Package },
  { key: "ledger", label: "Ledger", icon: Wallet },
];

export default function KarigarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [karigar, setKarigar] = useState<KarigarFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKarigar();
  }, [params.id]);

  async function fetchKarigar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/karigars/${params.id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Karigar not found");
        throw new Error("Failed to load");
      }
      const data = await res.json();
      setKarigar(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load karigar");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <KarigarDetailSkeleton />;

  if (error || !karigar) {
    return (
      <FadeIn>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg font-medium text-foreground">
            {error ?? "Karigar not found"}
          </p>
          <Link
            href="/karigars"
            className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Karigars
          </Link>
        </div>
      </FadeIn>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/karigars"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Karigars
      </Link>

      {/* Header */}
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white",
                karigar.type === "stitching" ? "bg-secondary" : "bg-accent"
              )}
            >
              {karigar.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  {karigar.name}
                </h1>
                {karigar.active ? (
                  <UserCheck className="h-5 w-5 text-success" />
                ) : (
                  <UserX className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="capitalize">{karigar.type}</span>
                {karigar.gender && <span>{karigar.gender}</span>}
                <a
                  href={`tel:${karigar.phone}`}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {karigar.phone}
                </a>
                {karigar.selfPickup && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    Self Pickup
                  </span>
                )}
              </div>
            </div>
          </div>

          <KarigarFormSheet
            editKarigar={{
              id: karigar.id,
              name: karigar.name,
              type: karigar.type,
              gender: karigar.gender,
              phone: karigar.phone,
              selfPickup: karigar.selfPickup,
            }}
            onSuccess={fetchKarigar}
            trigger={
              <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted active:scale-[0.98]">
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            }
          />
        </div>
      </FadeIn>

      {/* Tabs */}
      <FadeIn delay={0.05}>
        <div className="flex gap-1 border-b border-border">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
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
        {activeTab === "overview" && <OverviewTab karigar={karigar} />}
        {activeTab === "assignments" && (
          <AssignmentsTab assignments={karigar.assignments} />
        )}
        {activeTab === "ledger" && (
          <LedgerTab
            karigarId={karigar.id}
            ledgerEntries={karigar.ledgerEntries}
            settlements={karigar.settlements}
            onSuccess={fetchKarigar}
          />
        )}
      </motion.div>
    </div>
  );
}

/* ── Overview Tab ── */
function OverviewTab({ karigar }: { karigar: KarigarFull }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Personal Info
        </h3>
        <dl className="mt-4 space-y-3">
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Type</dt>
            <dd className="text-sm font-medium text-foreground capitalize">
              {karigar.type}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Gender</dt>
            <dd className="text-sm font-medium text-foreground">
              {karigar.gender ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Phone</dt>
            <dd className="text-sm font-medium text-foreground">
              {karigar.phone}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Self Pickup</dt>
            <dd className="text-sm font-medium text-foreground">
              {karigar.selfPickup ? "Yes" : "No"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Status</dt>
            <dd>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                  karigar.active
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                )}
              >
                {karigar.active ? "Active" : "Inactive"}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Summary
        </h3>
        <dl className="mt-4 space-y-3">
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">
              Total Assignments
            </dt>
            <dd className="font-heading text-lg font-bold tabular-nums text-foreground">
              {karigar.assignments.length}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Completed</dt>
            <dd className="font-heading text-lg font-bold tabular-nums text-success">
              {karigar.assignments.filter((a) => a.status === "completed" || a.status === "paid").length}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">In Progress</dt>
            <dd className="font-heading text-lg font-bold tabular-nums text-warning">
              {karigar.assignments.filter((a) => a.status === "in_progress").length}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Settlements</dt>
            <dd className="font-heading text-lg font-bold tabular-nums text-foreground">
              {karigar.settlements.length}
            </dd>
          </div>
        </dl>
      </div>
      </div>

      {/* Portal PIN */}
      <SetPinForm karigarId={karigar.id} hasPin={karigar.hasPin} />
      <KarigarRates karigarId={karigar.id} />
    </div>
  );
}

/* ── Assignments Tab ── */
function AssignmentsTab({
  assignments,
}: {
  assignments: AssignmentData[];
}) {
  if (assignments.length === 0) {
    return (
      <EmptyState
        title="No assignments yet"
        description="Assignments will appear here once this karigar is assigned bundles."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Batch
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pieces
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Rate
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Date Given
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
          {assignments.map((a, idx) => (
            <tr
              key={a.id}
              className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
            >
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">
                    {a.batch.designName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.batch.color}
                  </p>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-heading tabular-nums text-foreground">
                {a.piecesReturned ?? a.piecesAssigned}
                <span className="text-xs text-muted-foreground">
                  /{a.piecesAssigned}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-heading tabular-nums text-foreground">
                {formatCurrency(a.batch.ratePerPiece)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(a.dateGiven)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {a.dateCollected ? formatDate(a.dateCollected) : "—"}
              </td>
              <td className="px-4 py-3 text-center">
                <StatusBadge status={a.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Ledger Tab ── */
function LedgerTab({
  karigarId,
  ledgerEntries,
  settlements,
  onSuccess,
}: {
  karigarId: number;
  ledgerEntries: LedgerEntryData[];
  settlements: SettlementData[];
  onSuccess?: () => void;
}) {
  const hasData = ledgerEntries.length > 0 || settlements.length > 0;

  // Compute running balance (entries are ordered by date desc, so reverse for running)
  const sorted = [...ledgerEntries].sort(
    (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
  );

  let runningBalance = 0;
  const withBalance = sorted.map((entry) => {
    runningBalance += Number(entry.amount);
    return { ...entry, balance: runningBalance };
  });

  // Reverse to show most recent first, with correct running balance
  const latestBalance = runningBalance;

  return (
    <div className="space-y-6">
      {/* Withdrawal Action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-base font-semibold text-foreground">
            Ledger
          </h3>
          <p className="text-xs text-muted-foreground">
            Withdrawals reduce the next settlement. Rounding carries adjust for over/under payment.
          </p>
        </div>
        <WithdrawalForm karigarId={karigarId} onSuccess={onSuccess} />
      </div>

      {/* Current Balance Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Current Open Ledger Balance
        </p>
        <p
          className={cn(
            "mt-1 font-heading text-3xl font-bold tabular-nums",
            latestBalance > 0
              ? "text-amber-600"
              : latestBalance < 0
                ? "text-blue-600"
                : "text-foreground"
          )}
        >
          {latestBalance === 0 ? "Settled" : `${latestBalance >= 0 ? "+" : ""}${formatCurrency(latestBalance)}`}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {latestBalance > 0
            ? `Karigar owes ${formatCurrency(latestBalance)} (deducted from next settlement)`
            : latestBalance < 0
              ? `Company owes ${formatCurrency(Math.abs(latestBalance))} (added to next settlement)`
              : "No open balance"}
        </p>
      </div>

      {!hasData && ledgerEntries.length === 0 && (
        <EmptyState
          title="No ledger activity yet"
          description="Withdrawals and rounding carries will appear here as the karigar works and gets paid."
        />
      )}

      {/* Ledger Entries with Running Balance */}
      {ledgerEntries.length > 0 && (
        <div>
          <h3 className="mb-3 font-heading text-sm font-semibold text-foreground">
            Ledger Entries ({ledgerEntries.length})
          </h3>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...withBalance].reverse().map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(entry.entryDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          entry.entryType === "withdrawal"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        )}
                      >
                        {entry.entryType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-heading tabular-nums text-foreground">
                      {Number(entry.amount) >= 0 ? "+" : ""}
                      {formatCurrency(entry.amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-heading tabular-nums">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          entry.balance > 0
                            ? "text-amber-600"
                            : entry.balance < 0
                              ? "text-blue-600"
                              : "text-muted-foreground"
                        )}
                      >
                        {formatCurrency(entry.balance)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {entry.notes ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settlements */}
      {settlements.length > 0 && (
        <div>
          <h3 className="mb-3 font-heading text-sm font-semibold text-foreground">
            Settlement History ({settlements.length})
          </h3>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Net Payable
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Paid
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Rounding
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Mode
                  </th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(s.settlementDate)}
                    </td>
                    <td className="px-4 py-3 text-right font-heading tabular-nums text-foreground">
                      {formatCurrency(s.netPayable)}
                    </td>
                    <td className="px-4 py-3 text-right font-heading tabular-nums text-success">
                      {formatCurrency(s.amountPaid)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {Number(s.roundingDiff) !== 0 ? (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            Number(s.roundingDiff) > 0
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                          )}
                        >
                          {Number(s.roundingDiff) > 0 ? "+" : ""}
                          {formatCurrency(s.roundingDiff)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">
                      {s.paymentMode}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
