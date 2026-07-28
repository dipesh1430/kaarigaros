"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { BatchFormValues } from "@/lib/validations/batch.schema";
import { batchSchema } from "@/lib/validations/batch.schema";

interface BatchFormSheetProps {
  merchantId: number;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function BatchFormSheet({
  merchantId,
  trigger,
  onSuccess,
}: BatchFormSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      merchantId,
      designName: "",
      color: "",
      garmentType: "kurti",
      fabricReceivedMeters: 0,
      ratePerPiece: 0,
      totalPiecesPlanned: null,
      dateReceived: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        merchantId,
        designName: "",
        color: "",
        garmentType: "kurti",
        fabricReceivedMeters: 0,
        ratePerPiece: 0,
        totalPiecesPlanned: null,
        dateReceived: new Date().toISOString().split("T")[0],
      });
    }
  }, [open, merchantId, reset]);

  function handleClose() {
    setOpen(false);
    reset();
  }

  async function onSubmit(data: BatchFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Something went wrong");
      }

      toast.success("Batch created successfully", {
        description: `${data.designName} — ${data.color}`,
      });

      handleClose();
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create batch", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger ?? (
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            New Batch
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/30"
              onClick={handleClose}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-card shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  Create New Batch
                </h2>
                <button
                  onClick={handleClose}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-5 overflow-y-auto p-6"
                style={{ maxHeight: "calc(100vh - 73px)" }}
              >
                {/* Design Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Design Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register("designName")}
                    placeholder="e.g. Printed Kurti A"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {errors.designName && (
                    <p className="text-xs text-destructive">
                      {errors.designName.message}
                    </p>
                  )}
                </div>

                {/* Color + Garment Type side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Color <span className="text-destructive">*</span>
                    </label>
                    <input
                      {...register("color")}
                      placeholder="e.g. Red"
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {errors.color && (
                      <p className="text-xs text-destructive">
                        {errors.color.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Garment <span className="text-destructive">*</span>
                    </label>
                    <select
                      {...register("garmentType")}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="kurti">Kurti</option>
                      <option value="pant">Pant</option>
                    </select>
                    {errors.garmentType && (
                      <p className="text-xs text-destructive">
                        {errors.garmentType.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Fabric + Rate */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Fabric (meters) <span className="text-destructive">*</span>
                    </label>
                    <input
                      {...register("fabricReceivedMeters", {
                        valueAsNumber: true,
                      })}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="e.g. 500"
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {errors.fabricReceivedMeters && (
                      <p className="text-xs text-destructive">
                        {errors.fabricReceivedMeters.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Rate/piece (₹) <span className="text-destructive">*</span>
                    </label>
                    <input
                      {...register("ratePerPiece", { valueAsNumber: true })}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="e.g. 45"
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {errors.ratePerPiece && (
                      <p className="text-xs text-destructive">
                        {errors.ratePerPiece.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Planned pieces */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Planned Pieces (optional)
                  </label>
                  <input
                    {...register("totalPiecesPlanned", {
                      setValueAs: (v) =>
                        v === "" || v === null || v === 0 ? null : Number(v),
                    })}
                    type="number"
                    inputMode="numeric"
                    placeholder="e.g. 500"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Date Received <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register("dateReceived")}
                    type="date"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {errors.dateReceived && (
                    <p className="text-xs text-destructive">
                      {errors.dateReceived.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Batch"
                  )}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
