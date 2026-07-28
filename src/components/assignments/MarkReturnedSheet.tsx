"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Undo2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { MarkReturnedValues } from "@/lib/validations/assignment.schema";
import { markReturnedSchema } from "@/lib/validations/assignment.schema";

interface MarkReturnedSheetProps {
  assignmentId: number;
  karigarName: string;
  piecesAssigned: number;
  onSuccess?: () => void;
}

export function MarkReturnedSheet({
  assignmentId,
  karigarName,
  piecesAssigned,
  onSuccess,
}: MarkReturnedSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MarkReturnedValues>({
    resolver: zodResolver(markReturnedSchema),
    defaultValues: {
      piecesReturned: piecesAssigned,
      dateCollected: new Date().toISOString().split("T")[0],
    },
  });

  function handleClose() {
    setOpen(false);
    reset();
  }

  async function onSubmit(data: MarkReturnedValues) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Something went wrong");
      }

      toast.success("Return recorded", {
        description: `${data.piecesReturned} pieces collected from ${karigarName}`,
      });

      handleClose();
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to record return", {
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
        className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-medium text-success transition-all hover:bg-success/20 active:scale-[0.97]"
      >
        <Undo2 className="h-3.5 w-3.5" />
        Mark Returned
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
                  Mark Returned — {karigarName}
                </h2>
                <button
                  onClick={handleClose}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-5 p-6"
              >
                {/* Pieces Returned */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Pieces Returned <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register("piecesReturned", { valueAsNumber: true })}
                    type="number"
                    inputMode="numeric"
                    placeholder={`Max: ${piecesAssigned}`}
                    max={piecesAssigned}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">
                    Assigned: {piecesAssigned} pieces
                  </p>
                  {errors.piecesReturned && (
                    <p className="text-xs text-destructive">
                      {errors.piecesReturned.message}
                    </p>
                  )}
                </div>

                {/* Date Collected */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Date Collected <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register("dateCollected")}
                    type="date"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {errors.dateCollected && (
                    <p className="text-xs text-destructive">
                      {errors.dateCollected.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-success px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-success/90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Undo2 className="h-4 w-4" />
                      Confirm Return
                    </>
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
