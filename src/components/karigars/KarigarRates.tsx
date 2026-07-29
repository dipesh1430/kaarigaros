"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, IndianRupee, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

interface KarigarRate {
  id: number;
  designName: string;
  color: string | null;
  garmentType: string | null;
  ratePerPiece: string;
  notes: string | null;
  active: boolean;
}

interface KarigarRatesProps {
  karigarId: number;
}

export function KarigarRates({ karigarId }: KarigarRatesProps) {
  const router = useRouter();
  const [rates, setRates] = useState<KarigarRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    designName: "",
    color: "",
    garmentType: "",
    ratePerPiece: "",
    notes: "",
  });

  useEffect(() => {
    fetchRates();
  }, [karigarId]);

  async function fetchRates() {
    try {
      const res = await fetch(`/api/karigar-rates?karigarId=${karigarId}`);
      if (res.ok) {
        setRates(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch rates:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.designName || !formData.ratePerPiece) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/karigar-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          karigarId,
          designName: formData.designName,
          color: formData.color || null,
          garmentType: formData.garmentType || null,
          ratePerPiece: parseFloat(formData.ratePerPiece),
          notes: formData.notes || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success("Rate saved");
      setFormData({ designName: "", color: "", garmentType: "", ratePerPiece: "", notes: "" });
      setShowForm(false);
      fetchRates();
    } catch {
      toast.error("Failed to save rate");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/karigar-rates?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Rate removed");
        fetchRates();
      }
    } catch {
      toast.error("Failed to remove rate");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-semibold text-foreground">Piece Rates</h3>
          <p className="text-xs text-muted-foreground">
            Set different rates per design/color for this karigar
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Rate
        </button>
      </div>

      {/* Add Rate Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSubmit}
            className="mt-4 space-y-3 overflow-hidden rounded-lg border border-border bg-muted/30 p-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <input
                value={formData.designName}
                onChange={(e) => setFormData({ ...formData, designName: e.target.value })}
                placeholder="Design name *"
                required
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              <input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Color (optional)"
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.garmentType}
                onChange={(e) => setFormData({ ...formData, garmentType: e.target.value })}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All types</option>
                <option value="kurti">Kurti</option>
                <option value="pant">Pant</option>
              </select>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={formData.ratePerPiece}
                  onChange={(e) => setFormData({ ...formData, ratePerPiece: e.target.value })}
                  placeholder="Rate/piece *"
                  required
                  className="w-full rounded-lg border border-input bg-background px-8 py-2 text-sm"
                />
              </div>
            </div>
            <input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes (optional)"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Rate"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Rates List */}
      {loading ? (
        <div className="mt-4 space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : rates.length === 0 ? (
        <p className="mt-4 text-xs text-muted-foreground">
          No custom rates set. Default batch rate will be used for settlements.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {rates.map((rate) => (
            <div
              key={rate.id}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium text-foreground">
                  {rate.designName}
                </span>
                {rate.color && (
                  <span className="shrink-0 text-xs text-muted-foreground">({rate.color})</span>
                )}
                <span className="shrink-0 text-xs text-muted-foreground capitalize">
                  {rate.garmentType ?? "all"}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-heading text-sm font-bold tabular-nums text-foreground">
                  {formatCurrency(rate.ratePerPiece)}
                </span>
                <button
                  onClick={() => handleDelete(rate.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
