"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Wallet,
  Loader2,
  CheckCircle,
  ArrowRight,
  IndianRupee,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import { FadeIn } from "@/components/shared/FadeIn";
import { formatCurrency, cn } from "@/lib/utils";
import type { SettlementPreview } from "@/lib/calculations/settlement-engine";

interface KarigarOption {
  id: number;
  name: string;
  type: string;
  phone: string;
  active: boolean;
}

export function SettlementWizard() {
  const router = useRouter();
  const [karigars, setKarigars] = useState<KarigarOption[]>([]);
  const [selectedKarigarId, setSelectedKarigarId] = useState<number | null>(null);
  const [preview, setPreview] = useState<SettlementPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "gpay">("cash");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [showAssignments, setShowAssignments] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchKarigars();
  }, []);

  async function fetchKarigars() {
    try {
      const res = await fetch("/api/karigars");
      if (res.ok) {
        const data = await res.json();
        setKarigars(data.filter((k: KarigarOption) => k.active));
      }
    } catch (err) {
      console.error("Failed to fetch karigars:", err);
    }
  }

  useEffect(() => {
    if (!selectedKarigarId) {
      setPreview(null);
      setAmountPaid("");
      setPreviewError(null);
      return;
    }

    loadPreview(selectedKarigarId);
  }, [selectedKarigarId]);

  async function loadPreview(karigarId: number) {
    setLoadingPreview(true);
    setPreviewError(null);
    setAmountPaid("");

    try {
      const res = await fetch(`/api/settlements/preview?karigarId=${karigarId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load preview");
      }
      const data = await res.json();
      setPreview(data);
    } catch (err) {
      setPreviewError(
        err instanceof Error ? err.message : "Failed to load preview"
      );
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  }

  const parsedAmount = parseFloat(amountPaid) || 0;
  const roundingDiff = preview ? parsedAmount - preview.netPayable : 0;

  async function handleConfirm() {
    if (!selectedKarigarId || !preview) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          karigarId: selectedKarigarId,
          amountPaid: parsedAmount,
          paymentMode,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to process settlement");
      }

      toast.success("Settlement processed", {
        description: `${preview.karigarName} — ${formatCurrency(parsedAmount)} paid`,
      });

      setDone(true);
      router.refresh();
    } catch (err) {
      toast.error("Settlement failed", {
        description:
          err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Filter karigars by search
  const filteredKarigars = karigars.filter(
    (k) =>
      k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.phone.includes(searchTerm)
  );

  if (done) {
    return (
      <FadeIn>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 200 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-12 shadow-sm text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h2 className="mt-4 font-heading text-xl font-bold text-foreground">
            Settlement Complete!
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {preview?.karigarName} — {formatCurrency(parsedAmount)} via{" "}
            {paymentMode === "cash" ? "Cash" : "GPay"}
          </p>
          {roundingDiff !== 0 && (
            <p className="mt-2 rounded-lg bg-muted px-4 py-2 text-xs text-muted-foreground">
              Rounding{" "}
              {roundingDiff > 0
                ? `overpayment of ${formatCurrency(Math.abs(roundingDiff))}`
                : `underpayment of ${formatCurrency(Math.abs(roundingDiff))}`}{" "}
              — credited to karigar&apos;s ledger for next settlement.
            </p>
          )}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setDone(false);
                setSelectedKarigarId(null);
                setPreview(null);
                setAmountPaid("");
              }}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              New Settlement
            </button>
            <button
              onClick={() => router.push("/settlements")}
              className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted"
            >
              View History
            </button>
          </div>
        </motion.div>
      </FadeIn>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Left — Karigar Selection */}
      <div className="lg:col-span-2 space-y-4">
        <FadeIn>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-heading text-base font-semibold text-foreground">
              1. Select Karigar
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Choose an active karigar to settle
            </p>

            {/* Search */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or phone..."
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Karigar List */}
            <div className="mt-3 space-y-1 max-h-80 overflow-y-auto">
              {filteredKarigars.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setSelectedKarigarId(k.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all",
                    selectedKarigarId === k.id
                      ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white shrink-0">
                    {k.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{k.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {k.type} · {k.phone}
                    </p>
                  </div>
                  {selectedKarigarId === k.id && (
                    <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </button>
              ))}
              {filteredKarigars.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No karigars found
                </p>
              )}
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Right — Preview & Confirm */}
      <div className="lg:col-span-3 space-y-4">
        {/* Loading */}
        {loadingPreview && (
          <div className="flex items-center justify-center rounded-xl border border-border bg-card p-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error */}
        {previewError && !loadingPreview && (
          <FadeIn>
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
              <p className="mt-2 text-sm text-muted-foreground">
                {previewError}
              </p>
              <button
                onClick={() =>
                  selectedKarigarId && loadPreview(selectedKarigarId)
                }
                className="mt-4 text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          </FadeIn>
        )}

        {/* Preview */}
        {preview && !loadingPreview && (
          <FadeIn>
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="font-heading text-lg font-bold text-foreground">
                        {preview.karigarName}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {preview.unpaidAssignments.length} unpaid assignment
                        {preview.unpaidAssignments.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amounts */}
                <div className="mt-6 grid grid-cols-3 gap-4 rounded-lg bg-muted/30 p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Calculated Amount
                    </p>
                    <p className="font-heading text-lg font-bold tabular-nums text-foreground">
                      {formatCurrency(preview.calculatedAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Ledger Balance
                    </p>
                    <p
                      className={cn(
                        "font-heading text-lg font-bold tabular-nums",
                        preview.ledgerBalance >= 0
                          ? "text-destructive"
                          : "text-success"
                      )}
                    >
                      {preview.ledgerBalance >= 0 ? "+" : ""}
                      {formatCurrency(preview.ledgerBalance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Net Payable
                    </p>
                    <p className="font-heading text-2xl font-bold tabular-nums text-primary">
                      {formatCurrency(preview.netPayable)}
                    </p>
                  </div>
                </div>

                {/* Open Withdrawals */}
                {preview.openWithdrawals.length > 0 && (
                  <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xs font-medium text-amber-700">
                      Open Withdrawals ({preview.openWithdrawals.length})
                    </p>
                    {preview.openWithdrawals.map((w) => (
                      <p
                        key={w.id}
                        className="mt-1 text-xs text-amber-600"
                      >
                        {formatCurrency(w.amount)}
                        {w.notes ? ` — ${w.notes}` : ""}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Details */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="font-heading font-semibold text-foreground">
                  2. Payment Details
                </h3>

                {/* Payment Mode */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setPaymentMode("cash")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all",
                      paymentMode === "cash"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground/30"
                    )}
                  >
                    <IndianRupee className="h-4 w-4" />
                    Cash
                  </button>
                  <button
                    onClick={() => setPaymentMode("gpay")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all",
                      paymentMode === "gpay"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground/30"
                    )}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.5 10.5h-2.25V9h2.25v1.5zM9 9v4.5h1.5V9H9zm4.5 0v4.5H15V9h-1.5z" />
                      <path d="M20.25 3H3.75A2.25 2.25 0 001.5 5.25v10.5A2.25 2.25 0 003.75 18h6.75l3 3 3-3h6.75a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0020.25 3zm0 12.75H3.75V5.25h16.5v10.5z" />
                    </svg>
                    GPay
                  </button>
                </div>

                {/* Amount Paid — with live rounding */}
                <div className="mt-4 space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder={String(preview.netPayable)}
                    className="w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-lg font-heading font-bold tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Live Rounding Diff */}
                {parsedAmount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "mt-3 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm",
                      roundingDiff === 0
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : Math.abs(roundingDiff) < 10
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                    )}
                  >
                    {roundingDiff === 0 ? (
                      <CheckCircle className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>
                      {roundingDiff === 0
                        ? "Exact amount — no rounding carry"
                        : roundingDiff > 0
                          ? `Overpayment of ${formatCurrency(roundingDiff)} — will be credited to karigar's ledger`
                          : `Underpayment of ${formatCurrency(Math.abs(roundingDiff))} — will be carried to next settlement`}
                    </span>
                  </motion.div>
                )}

                {/* Confirm Button */}
                <button
                  onClick={handleConfirm}
                  disabled={
                    submitting ||
                    !parsedAmount ||
                    parsedAmount <= 0
                  }
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4" />
                      Confirm Settlement — {parsedAmount > 0 ? formatCurrency(parsedAmount) : "Enter amount"}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Collapsible Assignment Details */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <button
                  onClick={() => setShowAssignments(!showAssignments)}
                  className="flex w-full items-center justify-between px-6 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  <span>
                    {preview.unpaidAssignments.length} Unpaid Assignment
                    {preview.unpaidAssignments.length !== 1 ? "s" : ""}
                  </span>
                  {showAssignments ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <AnimatePresence>
                  {showAssignments && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border px-6 py-3">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Batch
                              </th>
                              <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Pieces
                              </th>
                              <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Rate
                              </th>
                              <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {preview.unpaidAssignments.map((a) => (
                              <tr key={a.id} className="border-b border-border last:border-0">
                                <td className="py-2 text-muted-foreground">
                                  {a.batchDesignName}
                                  <span className="ml-1 text-xs">
                                    ({a.batchColor})
                                  </span>
                                </td>
                                <td className="py-2 text-right font-heading tabular-nums text-foreground">
                                  {a.piecesReturned}
                                </td>
                                <td className="py-2 text-right font-heading tabular-nums text-foreground">
                                  {formatCurrency(a.ratePerPiece)}
                                </td>
                                <td className="py-2 text-right font-heading font-bold tabular-nums text-foreground">
                                  {formatCurrency(a.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td
                                colSpan={3}
                                className="pt-3 text-right text-xs font-semibold text-muted-foreground"
                              >
                                Calculated Total
                              </td>
                              <td className="pt-3 text-right font-heading font-bold tabular-nums text-foreground">
                                {formatCurrency(preview.calculatedAmount)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </FadeIn>
        )}

        {/* No karigar selected */}
        {!selectedKarigarId && !loadingPreview && (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <div>
              <Wallet className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                Select a karigar to view their pending settlement
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
