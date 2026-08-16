import { CreatorDetailClient } from "./CreatorDetailClient";
import { UpgradeGate } from "@/components/shared/UpgradeGate";

export default async function CreatorDetailPage({ params }: { params: Promise<{ creatorId: string }> }) {
  const { creatorId } = await params;
  return (
    <UpgradeGate>
      <CreatorDetailClient creatorId={creatorId} />
    </UpgradeGate>
  );
}
