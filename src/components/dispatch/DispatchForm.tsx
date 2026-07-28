"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Truck } from "lucide-react";
import type { DispatchFormValues } from "@/lib/validations/dispatch.schema";
import { dispatchSchema } from "@/lib/validations/dispatch.schema";

interface DispatchFormProps {
  batchId: number;
  currentStatus: string;
  onSuccess?: () => void;
}

export function DispatchForm({
  batchId,
  currentStatus,
  onSuccess,
}: DispatchFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const canDispatch = ["ready", "press", "dispatched"].includes(currentStatus);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DispatchFormValues>({
    resolver: zodResolver(dispatchSchema),
    defaultValues: {
      batchId,
      chalanNumber: "",
      piecesDispatched: 0,
      dispatchDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  async function onSubmit(data: DispatchFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/dispatches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to dispatch");
      }

      toast.success("Dispatch recorded", {
        description: `Chalan ${data.chalanNumber} — ${data.piecesDispatched} pieces`,
      });

      reset();
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to record dispatch", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!canDispatch) {
    return null; // Don't show the form if batch isn't ready to dispatch
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Truck className="h-4 w-4 text-indigo-500" />
        Record Dispatch
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Chalan Number */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Chalan Number <span className="text-destructive">*</span>
          </label>
          <input
            {...register("chalanNumber")}
            placeholder="e.g. CH-001"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.chalanNumber && (
            <p className="text-xs text-destructive">
              {errors.chalanNumber.message}
            </p>
          )}
        </div>

        {/* Pieces */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Pieces Dispatched <span className="text-destructive">*</span>
          </label>
          <input
            {...register("piecesDispatched", { valueAsNumber: true })}
            type="number"
            inputMode="numeric"
            placeholder="e.g. 500"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.piecesDispatched && (
            <p className="text-xs text-destructive">
              {errors.piecesDispatched.message}
            </p>
          )}
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Dispatch Date <span className="text-destructive">*</span>
          </label>
          <input
            {...register("dispatchDate")}
            type="date"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.dispatchDate && (
            <p className="text-xs text-destructive">
              {errors.dispatchDate.message}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Dispatching...
          </>
        ) : (
          <>
            <Truck className="h-4 w-4" />
            Dispatch to Merchant
          </>
        )}
      </button>
    </form>
  );
}
