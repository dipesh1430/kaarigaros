"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { KarigarFormValues } from "@/lib/validations/karigar.schema";
import { karigarSchema } from "@/lib/validations/karigar.schema";

interface KarigarFormSheetProps {
  /** If provided, the sheet opens in edit mode with prefilled data */
  editKarigar?: {
    id: number;
    name: string;
    type: "stitching" | "button";
    gender: string | null;
    phone: string;
    selfPickup: boolean;
  };
  /** Trigger element — if not provided, uses a default button */
  trigger?: React.ReactNode;
  /** Called after successful create/update */
  onSuccess?: () => void;
}

export function KarigarFormSheet({
  editKarigar,
  trigger,
  onSuccess,
}: KarigarFormSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!editKarigar;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<KarigarFormValues>({
    resolver: zodResolver(karigarSchema),
    defaultValues: {
      name: "",
      type: "stitching",
      gender: "",
      phone: "",
      selfPickup: false,
    },
  });

  // Prefill form when editing
  useEffect(() => {
    if (editKarigar && open) {
      reset({
        name: editKarigar.name,
        type: editKarigar.type,
        gender: (editKarigar.gender ?? "") as "" | "Male" | "Female",
        phone: editKarigar.phone,
        selfPickup: editKarigar.selfPickup,
      });
    }
  }, [editKarigar, open, reset]);

  function handleClose() {
    setOpen(false);
    if (!isEdit) reset();
  }

  async function onSubmit(data: KarigarFormValues) {
    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/karigars/${editKarigar!.id}`
        : "/api/karigars";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Something went wrong");
      }

      toast.success(
        isEdit ? "Karigar updated successfully" : "Karigar added successfully",
        {
          description: data.name,
        }
      );

      handleClose();
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to save karigar", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Trigger */}
      <div onClick={() => setOpen(true)}>
        {trigger ?? (
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            Add Karigar
          </button>
        )}
      </div>

      {/* Sheet Overlay */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/30"
              onClick={handleClose}
            />

            {/* Sheet */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-card shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  {isEdit ? "Edit Karigar" : "Add New Karigar"}
                </h2>
                <button
                  onClick={handleClose}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-6 overflow-y-auto p-6"
                style={{ maxHeight: "calc(100vh - 73px)" }}
              >
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register("name")}
                    placeholder="e.g. Ramesh bhai"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Type <span className="text-destructive">*</span>
                  </label>
                  <select
                    {...register("type")}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="stitching">Stitching</option>
                    <option value="button">Button</option>
                  </select>
                  {errors.type && (
                    <p className="text-xs text-destructive">
                      {errors.type.message}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Gender
                  </label>
                  <select
                    {...register("gender")}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {errors.gender && (
                    <p className="text-xs text-destructive">
                      {errors.gender.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Phone <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register("phone")}
                    type="tel"
                    inputMode="tel"
                    placeholder="e.g. 9876543210"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Self Pickup */}
                <label className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 cursor-pointer">
                  <input
                    {...register("selfPickup")}
                    type="checkbox"
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Self Pickup
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Karigar delivers and collects bundles themselves
                    </p>
                  </div>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : isEdit ? (
                    "Save Changes"
                  ) : (
                    "Add Karigar"
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
