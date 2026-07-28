"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2,
  Wallet,
  Package,
  MessageCircle,
  LogOut,
  ArrowRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface WorkData {
  name: string;
  assignments: {
    id: number;
    piecesAssigned: number;
    piecesReturned: number | null;
    status: string;
    batch: { designName: string; color: string; ratePerPiece: number };
  }[];
  pendingPayout: number;
  ledgerBalance: number;
  hasPendingRequest: boolean;
}

export default function MyWorkPage() {
  const router = useRouter();
  const [data, setData] = useState<WorkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [karigarName, setKarigarName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("karigar_token");
    const name = localStorage.getItem("karigar_name");

    if (!token) {
      router.push("/karigar-login");
      return;
    }

    setKarigarName(name || "");
    fetchWork(token);
  }, []);

  async function fetchWork(token: string) {
    try {
      const karigarId = localStorage.getItem("karigar_id");
      const res = await fetch(`/api/karigars/${karigarId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to load data");
      }

      const karigar = await res.json();

      // Get pending payout
      const previewRes = await fetch(
        `/api/settlements/preview?karigarId=${karigarId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const preview = previewRes.ok ? await previewRes.json() : { netPayable: 0 };

      setData({
        name: karigar.name,
        assignments: karigar.assignments,
        pendingPayout: preview.netPayable,
        ledgerBalance: preview.ledgerBalance,
        hasPendingRequest: false,
      });

      // Check for pending request
      const reqRes = await fetch("/api/payment-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (reqRes.ok) {
        const requests = await reqRes.json();
        const myPending = requests.find(
          (r: any) => r.karigarId === Number(karigarId) && r.status === "pending"
        );
        setData((prev) =>
          prev ? { ...prev, hasPendingRequest: !!myPending } : prev
        );
      }
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestPayment() {
    const token = localStorage.getItem("karigar_token");
    const karigarId = localStorage.getItem("karigar_id");
    if (!token || !karigarId) return;

    setRequesting(true);
    try {
      const res = await fetch("/api/payment-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ karigarId: Number(karigarId) }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Failed to send request");
        setRequesting(false);
        return;
      }

      toast.success("Payment requested!", {
        description: "Maheshbhai has been notified",
      });

      // Open WhatsApp
      if (result.whatsappUrl) {
        window.open(result.whatsappUrl, "_blank");
      }

      setData((prev) => (prev ? { ...prev, hasPendingRequest: true } : prev));
    } catch {
      toast.error("Failed to send request");
    } finally {
      setRequesting(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("karigar_token");
    localStorage.removeItem("karigar_name");
    localStorage.removeItem("karigar_id");
    router.push("/karigar-login");
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading your work...</p>
      </div>
    );
  }

  if (!data) return null;

  const totalCompleted = data.assignments.filter(
    (a) => a.status === "completed" || a.status === "paid"
  ).length;
  const totalInProgress = data.assignments.filter(
    (a) => a.status === "in_progress"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Welcome, {data.name}
          </h2>
          <p className="text-xs text-muted-foreground">
            Your work dashboard
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>

      {/* Pending Payout — Hero Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Pending Payout
          </p>
          <p className="mt-2 font-heading text-4xl font-bold tabular-nums text-primary">
            {formatCurrency(data.pendingPayout)}
          </p>
          {data.ledgerBalance !== 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {data.ledgerBalance > 0
                ? `Includes ${formatCurrency(data.ledgerBalance)} advance`
                : `Includes ${formatCurrency(Math.abs(data.ledgerBalance))} carry-forward`}
            </p>
          )}
        </div>

        {/* Request Payment Button */}
        <button
          onClick={handleRequestPayment}
          disabled={requesting || data.hasPendingRequest || data.pendingPayout <= 0}
          className={cn(
            "mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3.5 text-sm font-semibold shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
            data.hasPendingRequest
              ? "bg-muted text-muted-foreground"
              : "bg-success text-white hover:bg-success/90 hover:shadow-md"
          )}
        >
          {requesting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : data.hasPendingRequest ? (
            <>
              <Clock className="h-4 w-4" />
              Request Sent — Waiting for Maheshbhai
            </>
          ) : data.pendingPayout <= 0 ? (
            <>
              <CheckCircle className="h-4 w-4" />
              No Pending Amount
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              Request Payment
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
        {data.pendingPayout > 0 && !data.hasPendingRequest && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Opens WhatsApp with a pre-filled message to Maheshbhai
          </p>
        )}
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="font-heading text-2xl font-bold tabular-nums text-foreground">
            {data.assignments.length}
          </p>
          <p className="text-xs text-muted-foreground">Total Bundles</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="font-heading text-2xl font-bold tabular-nums text-success">
            {totalCompleted}
          </p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="font-heading text-2xl font-bold tabular-nums text-warning">
            {totalInProgress}
          </p>
          <p className="text-xs text-muted-foreground">In Progress</p>
        </div>
      </div>

      {/* Assignments List */}
      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold text-foreground">
          Your Bundles
        </h3>
        {data.assignments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Package className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">
              No bundles assigned yet
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.assignments.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {a.batch.designName}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {a.batch.color}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.piecesAssigned} pieces · {formatCurrency(a.batch.ratePerPiece)}/piece
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      a.status === "in_progress"
                        ? "bg-amber-100 text-amber-700"
                        : a.status === "completed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                    )}
                  >
                    {a.status === "in_progress"
                      ? "In Progress"
                      : a.status === "completed"
                        ? "Completed"
                        : "Paid"}
                  </span>
                </div>
                {a.piecesReturned !== null && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Returned: {a.piecesReturned} pieces · Earned:{" "}
                    {formatCurrency(a.piecesReturned * a.batch.ratePerPiece)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
