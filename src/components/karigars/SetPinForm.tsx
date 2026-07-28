"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";

interface SetPinFormProps {
  karigarId: number;
  hasPin: boolean;
}

export function SetPinForm({ karigarId, hasPin }: SetPinFormProps) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSetPin() {
    if (!pin || pin.length < 4 || pin.length > 6) {
      toast.error("PIN must be 4-6 digits");
      return;
    }

    setSubmitting(true);
    try {
      // We reuse the karigar update endpoint with pinHash
      const res = await fetch(`/api/karigars/${karigarId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin }),
      });

      if (!res.ok) {
        throw new Error("Failed to set PIN");
      }

      toast.success(hasPin ? "PIN updated" : "PIN set successfully", {
        description: "The karigar can now log in to the portal",
      });

      setPin("");
      router.refresh();
    } catch {
      toast.error("Failed to set PIN");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-secondary" />
        <h3 className="font-heading font-semibold text-foreground">
          {hasPin ? "Update Portal PIN" : "Set Portal PIN"}
        </h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {hasPin
          ? "This karigar already has a PIN set. Update it below if needed."
          : "Set a 4-6 digit PIN so this karigar can log in to the portal."}
      </p>

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <input
            type={showPin ? "text" : "password"}
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter 4-6 digit PIN"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <button
          onClick={handleSetPin}
          disabled={submitting || !pin}
          className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground shadow-sm transition-all hover:bg-secondary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Save PIN"
          )}
        </button>
      </div>
    </div>
  );
}
