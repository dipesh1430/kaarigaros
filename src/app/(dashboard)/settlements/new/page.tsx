import { SettlementWizard } from "@/components/settlements/SettlementWizard";
import { FadeIn } from "@/components/shared/FadeIn";

export default function NewSettlementPage() {
  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            New Settlement
          </h1>
          <p className="text-sm text-muted-foreground">
            Settle a karigar&apos;s pending payout — all amounts calculated server-side from live data
          </p>
        </div>
      </FadeIn>

      <SettlementWizard />
    </div>
  );
}
