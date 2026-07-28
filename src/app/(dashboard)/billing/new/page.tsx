"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Receipt,
  Check,
  Loader2,
  Banknote,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/shared/FadeIn";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { calculateBilling } from "@/lib/calculations/billing";

interface UnbilledDispatch {
  id: number;
  chalanNumber: string;
  piecesDispatched: number;
  dispatchDate: string;
  batch: {
    designName: string;
    color: string;
    ratePerPiece: string;
    merchantId: number;
    merchant: { name: string };
  };
}

export default function NewBillingPage() {
  const router = useRouter();
  const [dispatches, setDispatches] = useState<UnbilledDispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [paymentMode, setPaymentMode] = useState<"cash" | "cheque">("cheque");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "received">("pending");
  const [billingDate, setBillingDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUnbilled();
  }, []);

  async function fetchUnbilled() {
    try {
      const res = await fetch("/api/dispatches?unbilled=true");
      if (res.ok) {
        const data = await res.json();
        setDispatches(data);
      }
    } catch (error) {
      console.error("Failed to fetch unbilled dispatches:", error);
    } finally {
      setLoading(false);
    }
  }

  const selectedDispatches = dispatches.filter((d) => selected.has(d.id));
  const calc = selectedDispatches.length > 0
    ? calculateBilling(selectedDispatches, paymentMode)
    : null;

  function toggleDispatch(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === dispatches.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(dispatches.map((d) => d.id)));
    }
  }

  async function handleCreateBilling() {
    if (selectedDispatches.length === 0) return;

    setSubmitting(true);
    try {
      const merchantId = selectedDispatches[0].batch.merchantId;

      const res = await fetch("/api/billings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId,
          billingDate,
          dispatchIds: Array.from(selected),
          paymentMode,
          paymentStatus,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create billing");
      }

      toast.success("Billing created", {
        description: `${selectedDispatches.length} dispatches · ${formatCurrency(calc?.netAmount ?? 0)}`,
      });

      router.push("/billing");
      router.refresh();
    } catch (error) {
      toast.error("Failed to create billing", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <Link
          href="/billing"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Billings
        </Link>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            New Billing
          </h1>
          <p className="text-sm text-muted-foreground">
            Select dispatched batches to bill the merchant
          </p>
        </div>
      </FadeIn>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty */}
      {!loading && dispatches.length === 0 && (
        <FadeIn>
          <EmptyState
            title="No unbilled dispatches"
            description="All dispatched batches have been billed. Create a dispatch from a batch detail page first."
            actionLabel="Back to Billings"
          />
        </FadeIn>
      )}

      {!loading && dispatches.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left — Dispatch Selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Select All */}
            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.size === dispatches.length}
                  onChange={selectAll}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                />
                <span className="text-sm font-medium text-foreground">
                  {selected.size === dispatches.length
                    ? "Deselect all"
                    : "Select all dispatches"}
                </span>
              </label>
              <span className="text-xs text-muted-foreground">
                {selected.size} of {dispatches.length} selected
              </span>
            </div>

            {/* Dispatch Cards */}
            <div className="space-y-2">
              {dispatches.map((d, idx) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-4 shadow-sm transition-all cursor-pointer hover:shadow-md",
                    selected.has(d.id)
                      ? "border-primary/50 bg-primary/5"
                      : "border-border bg-card"
                  )}
                  onClick={() => toggleDispatch(d.id)}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(d.id)}
                    onChange={() => toggleDispatch(d.id)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {d.batch.designName}
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {d.batch.color}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Chalan #{d.chalanNumber} · {formatDate(d.dispatchDate)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-heading font-bold tabular-nums text-foreground">
                      {d.piecesDispatched} pcs
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @ {formatCurrency(d.batch.ratePerPiece)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-heading tabular-nums text-foreground">
                      {formatCurrency(
                        parseFloat(d.batch.ratePerPiece) * d.piecesDispatched
                      )}
                    </p>
                  </div>
                  {selected.has(d.id) && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right — Summary Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="font-heading font-semibold text-foreground">
                  Billing Summary
                </h3>

                {/* Billing Date */}
                <div className="mt-4 space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Billing Date
                  </label>
                  <input
                    type="date"
                    value={billingDate}
                    onChange={(e) => setBillingDate(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {calc ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Dispatches
                      </span>
                      <span className="font-medium text-foreground">
                        {selectedDispatches.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Total Pieces
                      </span>
                      <span className="font-heading font-bold tabular-nums text-foreground">
                        {calc.totalPieces}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Gross Amount
                      </span>
                      <span className="font-heading font-bold tabular-nums text-foreground">
                        {formatCurrency(calc.grossAmount)}
                      </span>
                    </div>

                    {/* Payment Mode Toggle */}
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Payment Mode
                      </label>
                      <div className="flex rounded-lg border border-border p-0.5 bg-muted/30">
                        <button
                          onClick={() => setPaymentMode("cheque")}
                          className={cn(
                            "flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all",
                            paymentMode === "cheque"
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Cheque
                        </button>
                        <button
                          onClick={() => setPaymentMode("cash")}
                          className={cn(
                            "flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all",
                            paymentMode === "cash"
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Cash
                        </button>
                      </div>
                    </div>

                    {calc.tdsPercent > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          TDS ({calc.tdsPercent}%)
                        </span>
                        <span className="font-heading tabular-nums text-destructive">
                          -{formatCurrency(calc.tdsAmount)}
                        </span>
                      </div>
                    )}

                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-foreground">
                          Net Amount
                        </span>
                        <span className="font-heading text-lg font-bold tabular-nums text-primary">
                          {formatCurrency(calc.netAmount)}
                        </span>
                      </div>
                      {calc.tdsPercent > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          TDS of {calc.tdsPercent}% deducted for cheque payment
                        </p>
                      )}
                    </div>

                    {/* Payment Status */}
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Payment Status
                      </label>
                      <select
                        value={paymentStatus}
                        onChange={(e) =>
                          setPaymentStatus(
                            e.target.value as "pending" | "received"
                          )
                        }
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="pending">Pending</option>
                        <option value="received">Received</option>
                      </select>
                    </div>

                    <button
                      onClick={handleCreateBilling}
                      disabled={submitting}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Receipt className="h-4 w-4" />
                          Create Billing
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
                    Select dispatches to see the billing summary
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
