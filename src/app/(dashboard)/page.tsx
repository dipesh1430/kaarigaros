"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Layers,
  Truck,
  Users,
  Wallet,
  Receipt,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { FadeIn } from "@/components/shared/FadeIn";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { motion as m } from "framer-motion";

interface DashboardData {
  activeBatches: number;
  pendingDispatches: number;
  payableToKarigars: number;
  receivable: number;
  cashFlowGap: number;
  recentActivity: { id: number; designName: string; color: string; status: string; updatedAt: string }[];
  batchStatusCounts: { status: string; _count: { status: number } }[];
  pendingPaymentRequests: number;
}

const STATUS_ORDER = ["received", "cutting", "stitching", "interlock", "press", "ready", "dispatched", "billed"] as const;

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Your garment unit at a glance
        </p>
      </FadeIn>

      {/* KPI Cards */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Active Batches"
            value={data.activeBatches.toString()}
            subtitle={`${data.pendingDispatches} ready to dispatch`}
            icon={Layers}
            color="text-secondary"
          />
          <KpiCard
            title="Payable to Karigars"
            value={formatCurrency(data.payableToKarigars)}
            subtitle="Pending settlements"
            icon={Users}
            color="text-amber-600"
          />
          <KpiCard
            title="Receivable from Merchant"
            value={formatCurrency(data.receivable)}
            subtitle="Pending billing"
            icon={Receipt}
            color="text-success"
          />
          <KpiCard
            title="Cash Flow Gap"
            value={formatCurrency(data.cashFlowGap)}
            subtitle={data.cashFlowGap >= 0 ? "You're ahead" : "You owe more than owed"}
            icon={data.cashFlowGap >= 0 ? TrendingUp : TrendingDown}
            color={data.cashFlowGap >= 0 ? "text-success" : "text-destructive"}
          />
        </div>
      </FadeIn>

      {/* Payment Requests Banner */}
      {data.pendingPaymentRequests > 0 && (
        <FadeIn delay={0.1}>
          <Link
            href="/settlements/new"
            className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                {data.pendingPaymentRequests} pending payment request{data.pendingPaymentRequests !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-amber-600">
                Karigars are waiting for their settlements
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-amber-600" />
          </Link>
        </FadeIn>
      )}

      {/* Bottom Section — Pipeline + Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline Mini View */}
        <FadeIn delay={0.15}>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
              Batch Pipeline
            </h2>
            <div className="space-y-2">
              {STATUS_ORDER.map((status) => {
                const count =
                  data.batchStatusCounts.find((c) => c.status === status)
                    ?._count.status ?? 0;
                const maxCount = Math.max(
                  ...data.batchStatusCounts.map((c) => c._count.status),
                  1
                );

                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="w-20 text-xs capitalize text-muted-foreground">
                      {status}
                    </span>
                    <div className="flex-1 h-6 overflow-hidden rounded-full bg-muted/50">
                      <m.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / maxCount) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full rounded-full bg-primary/20 flex items-center justify-end pr-2"
                      >
                        {count > 0 && (
                          <span className="text-[10px] font-bold tabular-nums text-primary">
                            {count}
                          </span>
                        )}
                      </m.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeIn>

        {/* Recent Activity */}
        <FadeIn delay={0.2}>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
              Recent Activity
            </h2>
            {data.recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No activity yet. Create your first batch!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentActivity.slice(0, 8).map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.03 }}
                  >
                    <Link
                      href={`/batches/${item.id}`}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {item.designName}
                          <span className="ml-1 text-xs text-muted-foreground">
                            {item.color}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Updated {formatDate(item.updatedAt)}
                        </p>
                      </div>
                      <StatusBadge status={item.status} />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof Layers;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p className={cn("mt-2 font-heading text-2xl font-bold tabular-nums", color)}>
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-muted", color)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
