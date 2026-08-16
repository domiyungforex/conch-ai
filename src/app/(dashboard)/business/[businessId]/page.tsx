import { BusinessDetailClient } from "./BusinessDetailClient";
import { UpgradeGate } from "@/components/shared/UpgradeGate";

export default async function BusinessDetailPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return (
    <UpgradeGate>
      <BusinessDetailClient businessId={businessId} />
    </UpgradeGate>
  );
}
