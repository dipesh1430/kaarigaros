"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { formatCurrency } from "@/lib/utils";

const withdrawalSchema = z.object({
  amount: z.number().positive("Amount must be > 0"),
  entryDate: z.string().nonempty("Date is required"),
  notes: z.string().optional().nullable(),
});

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

interface WithdrawalFormProps {
  karigarId: number;
  onSuccess?: () => void;
}

export function WithdrawalForm({
  karigarId,
  onSuccess,
}: WithdrawalFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      entryDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  function handleClose() {
    setOpen(false);
    reset();
  }

  async function onSubmit(data: WithdrawalFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, karigarId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record withdrawal");
      }

      toast.success("Withdrawal recorded", {
        description: `${formatCurrency(data.amount)} deducted from next settlement`,
      });

      handleClose();
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to record withdrawal", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 hover:shadow-md active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" />
        Add Withdrawal
      </button>

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
                  Add Withdrawal
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
                className="flex flex-col gap-5 p-6"
              >
                <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  Withdrawals are deducted from the next settlement. They are
                  added as positive entries in the karigar&apos;s ledger.
                </p>

                {/* Amount */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Amount (₹) <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register("amount", { valueAsNumber: true })}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="e.g. 500"
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-lg font-heading font-bold tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {errors.amount && (
                    <p className="text-xs text-destructive">
                      {errors.amount.message}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register("entryDate")}
                    type="date"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {errors.entryDate && (
                    <p className="text-xs text-destructive">
                      {errors.entryDate.message}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Notes
                  </label>
                  <input
                    {...register("notes")}
                    placeholder="e.g. Advance for fabric purchase"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Record Withdrawal"
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
