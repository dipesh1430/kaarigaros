"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/shared/FadeIn";
import { StaggerList, StaggerItem } from "@/components/shared/StaggerList";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Wallet, Banknote, ArrowRight } from "lucide-react";

interface SettlementData {
  id: number;
  settlementDate: string;
  calculatedAmount: string;
  ledgerBalanceBefore: string;
  netPayable: string;
  amountPaid: string;
  roundingDiff: string;
  paymentMode: string;
  notes: string | null;
  karigar: { name: string; type: string };
  items: { piecesCounted: number; amount: string }[];
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<SettlementData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettlements();
  }, []);

  async function fetchSettlements() {
    try {
      const res = await fetch("/api/settlements");
      if (res.ok) {
        setSettlements(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch settlements:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          title="Settlements"
          actionHref="/settlements/new"
          actionLabel="New Settlement"
        />
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
              className="h-28 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && settlements.length === 0 && (
        <FadeIn>
          <EmptyState
            title="No settlements yet"
            description="When you pay a karigar, record the settlement here. The engine calculates everything from live data."
            actionHref="/settlements/new"
            actionLabel="First Settlement"
          />
        </FadeIn>
      )}

      {/* List */}
      {!loading && settlements.length > 0 && (
        <FadeIn delay={0.1}>
          <StaggerList className="space-y-3">
            {settlements.map((s) => (
              <StaggerItem key={s.id}>
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-white font-bold text-lg">
                        {s.karigar.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {s.karigar.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(s.settlementDate)} ·{" "}
                          {s.items.length} assignment{s.items.length !== 1 ? "s" : ""} ·{" "}
                          {s.paymentMode === "cash" ? "Cash" : "GPay"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Calculated → Paid flow */}
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Calculated</p>
                        <p className="font-heading text-sm tabular-nums text-muted-foreground">
                          {formatCurrency(s.calculatedAmount)}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Paid</p>
                        <p className="font-heading text-lg font-bold tabular-nums text-success">
                          {formatCurrency(s.amountPaid)}
                        </p>
                      </div>

                      {/* Rounding diff badge */}
                      {parseFloat(s.roundingDiff) !== 0 && (
                        <div
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            parseFloat(s.roundingDiff) > 0
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                          )}
                        >
                          {parseFloat(s.roundingDiff) > 0 ? "+" : ""}
                          {formatCurrency(s.roundingDiff)}
                        </div>
                      )}
                    </div>
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
