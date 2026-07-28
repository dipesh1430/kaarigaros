"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FadeIn } from "@/components/shared/FadeIn";
import { StaggerList, StaggerItem } from "@/components/shared/StaggerList";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Receipt, Banknote, Clock, CheckCircle } from "lucide-react";

interface BillingData {
  id: number;
  billingDate: string;
  totalPieces: number;
  grossAmount: string;
  tdsPercent: string;
  tdsAmount: string;
  netAmount: string;
  paymentMode: "cash" | "cheque";
  paymentStatus: "pending" | "received";
  merchant: { name: string };
  billingDispatches: {
    dispatch: {
      chalanNumber: string;
      batch: { designName: string; color: string };
    };
  }[];
}

export default function BillingPage() {
  const router = useRouter();
  const [billings, setBillings] = useState<BillingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillings();
  }, []);

  async function fetchBillings() {
    try {
      const res = await fetch("/api/billings");
      if (res.ok) {
        setBillings(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch billings:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader title="Billing" actionHref="/billing/new" actionLabel="New Billing" />
      </FadeIn>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="h-24 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && billings.length === 0 && (
        <FadeIn>
          <EmptyState
            title="No billing records yet"
            description="Dispatch finished batches first, then create a billing entry from them."
            actionHref="/billing/new"
            actionLabel="Create First Billing"
          />
        </FadeIn>
      )}

      {/* List */}
      {!loading && billings.length > 0 && (
        <FadeIn delay={0.1}>
          <StaggerList className="space-y-3">
            {billings.map((b) => (
              <StaggerItem key={b.id}>
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
                        <Receipt className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {b.merchant.name}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                              b.paymentStatus === "received"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            )}
                          >
                            {b.paymentStatus === "received" ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                Received
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3" />
                                Pending
                              </>
                            )}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDate(b.billingDate)} · {b.totalPieces} pieces
                          · {b.billingDispatches.length} dispatches
                          · {b.paymentMode === "cheque" ? "Cheque" : "Cash"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Gross</p>
                        <p className="font-heading font-bold tabular-nums text-foreground">
                          {formatCurrency(b.grossAmount)}
                        </p>
                      </div>
                      {parseFloat(b.tdsAmount) > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">TDS</p>
                          <p className="font-heading tabular-nums text-destructive">
                            -{formatCurrency(b.tdsAmount)}
                          </p>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Net</p>
                        <p className="font-heading text-lg font-bold tabular-nums text-primary">
                          {formatCurrency(b.netAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dispatches list */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {b.billingDispatches.map((bd) => (
                      <span
                        key={bd.dispatch.chalanNumber}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                      >
                        <Banknote className="h-3 w-3" />
                        {bd.dispatch.batch.designName} · #{bd.dispatch.chalanNumber}
                      </span>
                    ))}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </FadeIn>
      )}
    </div>
  );
}
