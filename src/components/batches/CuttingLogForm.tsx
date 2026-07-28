"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Scissors } from "lucide-react";
import type { CuttingLogFormValues } from "@/lib/validations/batch.schema";
import { cuttingLogSchema } from "@/lib/validations/batch.schema";
import { calculateYieldPercent } from "@/lib/calculations/yield";

interface CuttingLogFormProps {
  batchId: number;
  fabricReceivedMeters: number;
  onSuccess?: () => void;
}

export function CuttingLogForm({
  batchId,
  fabricReceivedMeters,
  onSuccess,
}: CuttingLogFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [previewYield, setPreviewYield] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CuttingLogFormValues>({
    resolver: zodResolver(cuttingLogSchema),
    defaultValues: {
      batchId,
      piecesCut: 0,
      fabricUsedMeters: 0,
      cuttingDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  // Live yield preview
  const watchedFabricUsed = watch("fabricUsedMeters");

  useState(() => {
    if (watchedFabricUsed > 0 && fabricReceivedMeters > 0) {
      setPreviewYield(
        calculateYieldPercent(watchedFabricUsed, fabricReceivedMeters)
      );
    }
  });

  // Watch for changes to show live preview
  const currentFabricUsed = watch("fabricUsedMeters");
  const liveYield =
    currentFabricUsed > 0 && fabricReceivedMeters > 0
      ? calculateYieldPercent(currentFabricUsed, fabricReceivedMeters)
      : null;

  async function onSubmit(data: CuttingLogFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/cutting-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, batchId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast.success("Cutting log recorded", {
        description: `${data.piecesCut} pieces cut from ${data.fabricUsedMeters}m`,
      });

      onSuccess?.();
    } catch (error) {
      toast.error("Failed to save cutting log", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Scissors className="h-4 w-4 text-secondary" />
        Add Cutting Log
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Pieces Cut */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Pieces Cut <span className="text-destructive">*</span>
          </label>
          <input
            {...register("piecesCut", { valueAsNumber: true })}
            type="number"
            inputMode="numeric"
            placeholder="e.g. 500"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.piecesCut && (
            <p className="text-xs text-destructive">
              {errors.piecesCut.message}
            </p>
          )}
        </div>

        {/* Fabric Used */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Fabric Used (m) <span className="text-destructive">*</span>
          </label>
          <input
            {...register("fabricUsedMeters", { valueAsNumber: true })}
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="e.g. 480"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.fabricUsedMeters && (
            <p className="text-xs text-destructive">
              {errors.fabricUsedMeters.message}
            </p>
          )}
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Date <span className="text-destructive">*</span>
          </label>
          <input
            {...register("cuttingDate")}
            type="date"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.cuttingDate && (
            <p className="text-xs text-destructive">
              {errors.cuttingDate.message}
            </p>
          )}
        </div>
      </div>

      {/* Live Yield Preview */}
      {liveYield !== null && (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2 text-sm text-success">
          <span className="font-heading font-bold tabular-nums">
            Yield: {liveYield}%
          </span>
          <span className="text-xs text-success/70">
            ({watchedFabricUsed}m / {fabricReceivedMeters}m)
          </span>
        </div>
      )}

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
          "Save Cutting Log"
        )}
      </button>
    </form>
  );
}
