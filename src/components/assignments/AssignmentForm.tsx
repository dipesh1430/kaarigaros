"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { X, Loader2, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AssignmentFormValues } from "@/lib/validations/assignment.schema";
import { assignmentSchema } from "@/lib/validations/assignment.schema";

interface KarigarOption {
  id: number;
  name: string;
  type: string;
  active: boolean;
}

interface AssignmentFormProps {
  batchId: number;
  onSuccess?: () => void;
  /** If true, renders as an inline section. If false (default), opens a sheet */
  inline?: boolean;
}

export function AssignmentForm({
  batchId,
  onSuccess,
  inline,
}: AssignmentFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [karigars, setKarigars] = useState<KarigarOption[]>([]);
  const [loadingKarigars, setLoadingKarigars] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      batchId,
      karigarId: 0,
      piecesAssigned: 0,
      dateGiven: new Date().toISOString().split("T")[0],
    },
  });

  // Fetch active karigars when opening
  useEffect(() => {
    if (open || inline) {
      fetchKarigars();
    }
  }, [open, inline]);

  async function fetchKarigars() {
    setLoadingKarigars(true);
    try {
      const res = await fetch("/api/karigars");
      if (res.ok) {
        const data = await res.json();
        setKarigars(data.filter((k: KarigarOption) => k.active));
      }
    } catch (error) {
      console.error("Failed to fetch karigars:", error);
    } finally {
      setLoadingKarigars(false);
    }
  }

  function handleClose() {
    setOpen(false);
    reset({ batchId, karigarId: 0, piecesAssigned: 0, dateGiven: new Date().toISOString().split("T")[0] });
  }

  async function onSubmit(data: AssignmentFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Something went wrong");
      }

      const karigar = karigars.find((k) => k.id === data.karigarId);
      toast.success("Bundle assigned", {
        description: `${data.piecesAssigned} pieces to ${karigar?.name ?? "karigar"}`,
      });

      handleClose();
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to assign", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Karigar Select */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Karigar <span className="text-destructive">*</span>
        </label>
        <select
          {...register("karigarId", { valueAsNumber: true })}
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value={0}>Select a karigar...</option>
          {loadingKarigars ? (
            <option disabled>Loading...</option>
          ) : (
            karigars.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} ({k.type})
              </option>
            ))
          )}
        </select>
        {errors.karigarId && (
          <p className="text-xs text-destructive">
            {errors.karigarId.message || "Please select a karigar"}
          </p>
        )}
      </div>

      {/* Pieces */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Pieces to Assign <span className="text-destructive">*</span>
        </label>
        <input
          {...register("piecesAssigned", { valueAsNumber: true })}
          type="number"
          inputMode="numeric"
          placeholder="e.g. 200"
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.piecesAssigned && (
          <p className="text-xs text-destructive">
            {errors.piecesAssigned.message}
          </p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Date Given <span className="text-destructive">*</span>
        </label>
        <input
          {...register("dateGiven")}
          type="date"
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.dateGiven && (
          <p className="text-xs text-destructive">
            {errors.dateGiven.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Assigning...
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            Assign Bundle
          </>
        )}
      </button>
    </form>
  );

  // Inline mode — just render the form directly
  if (inline) {
    return <div className="rounded-xl border border-border bg-card p-6 shadow-sm">{formContent}</div>;
  }

  // Sheet mode
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground shadow-sm transition-all hover:bg-secondary/90 hover:shadow-md active:scale-[0.98]"
      >
        <UserPlus className="h-4 w-4" />
        Assign Karigar
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
                  Assign Bundle
                </h2>
                <button
                  onClick={handleClose}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">{formContent}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
