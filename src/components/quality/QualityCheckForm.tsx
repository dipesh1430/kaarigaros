"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Home, Factory } from "lucide-react";
import type { QualityCheckFormValues } from "@/lib/validations/quality-check.schema";
import { qualityCheckSchema } from "@/lib/validations/quality-check.schema";

interface QualityCheckFormProps {
  batchId: number;
  currentStatus: string;
  onSuccess?: () => void;
  /** Which checkpoint to show by default */
  defaultCheckpoint?: "home" | "press_vendor";
}

export function QualityCheckForm({
  batchId,
  currentStatus,
  onSuccess,
  defaultCheckpoint = "home",
}: QualityCheckFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const canDoHomeQC = ["stitching", "interlock"].includes(currentStatus);
  const canDoPressQC = currentStatus === "press";
  const activeCheckpoint = canDoPressQC ? "press_vendor" : canDoHomeQC ? defaultCheckpoint : null;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<QualityCheckFormValues>({
    resolver: zodResolver(qualityCheckSchema),
    defaultValues: {
      batchId,
      checkedBy: activeCheckpoint ?? "home",
      piecesChecked: 0,
      piecesRejected: 0,
      rejectionReason: "",
      checkDate: new Date().toISOString().split("T")[0],
    },
  });

  const watchedRejected = watch("piecesRejected");
  const watchedChecked = watch("piecesChecked");
  const rejectRate =
    watchedChecked > 0
      ? Math.round((watchedRejected / watchedChecked) * 100)
      : null;

  async function onSubmit(data: QualityCheckFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/quality-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      const label =
        data.checkedBy === "home" ? "Home check" : "Press vendor check";
      toast.success(`${label} recorded`, {
        description: `${data.piecesChecked} checked, ${data.piecesRejected} rejected`,
      });

      reset();
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to save quality check", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!canDoHomeQC && !canDoPressQC) {
    const statusMsg: Record<string, string> = {
      received: "Start cutting and assignments first",
      cutting: "Finish cutting and assignments first",
      ready: "Quality checks are complete",
      dispatched: "Already dispatched",
      billed: "Already billed",
    };

    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          {statusMsg[currentStatus] ?? `Batch status: ${currentStatus}`}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <ShieldCheck className="h-4 w-4 text-accent" />
        {canDoPressQC ? "Press Vendor Quality Check" : "Home Quality Check"}
      </div>

      {/* Checkpoint Info */}
      <div className="flex gap-3 rounded-lg bg-muted/50 p-3">
        {canDoPressQC ? (
          <>
            <Factory className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Press Vendor Check</p>
              <p className="text-xs text-muted-foreground">
                The press vendor does a formal QC before pressing. This advances the batch to Ready.
              </p>
            </div>
          </>
        ) : (
          <>
            <Home className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Home Check</p>
              <p className="text-xs text-muted-foreground">
                Visual inspection for tears, damage, or shortage before sending to press.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Hidden field for checkpoint type */}
      <input type="hidden" {...register("checkedBy")} />

      {/* Pieces checked + rejected side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Pieces Checked <span className="text-destructive">*</span>
          </label>
          <input
            {...register("piecesChecked", { valueAsNumber: true })}
            type="number"
            inputMode="numeric"
            placeholder="e.g. 500"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.piecesChecked && (
            <p className="text-xs text-destructive">{errors.piecesChecked.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Rejected Pieces
          </label>
          <input
            {...register("piecesRejected", { valueAsNumber: true })}
            type="number"
            inputMode="numeric"
            placeholder="e.g. 5"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.piecesRejected && (
            <p className="text-xs text-destructive">{errors.piecesRejected.message}</p>
          )}
        </div>
      </div>

      {/* Live reject rate */}
      {rejectRate !== null && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
          rejectRate > 10
            ? "bg-destructive/10 text-destructive"
            : rejectRate > 5
              ? "bg-warning/10 text-warning"
              : "bg-success/10 text-success"
        }`}>
          <span className="font-heading font-bold tabular-nums">
            Rejection rate: {rejectRate}%
          </span>
          <span className="text-xs opacity-70">
            ({watchedRejected} / {watchedChecked})
          </span>
        </div>
      )}

      {/* Rejection reason */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Rejection Reason
        </label>
        <input
          {...register("rejectionReason")}
          placeholder="e.g. tearing, stitching defect, stain"
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Date */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Check Date <span className="text-destructive">*</span>
        </label>
        <input
          {...register("checkDate")}
          type="date"
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.checkDate && (
          <p className="text-xs text-destructive">{errors.checkDate.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Quality Check"
        )}
      </button>
    </form>
  );
}
