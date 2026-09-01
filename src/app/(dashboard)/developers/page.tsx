import type { Metadata } from "next";
import { DeveloperDashboard } from "@/components/developers/DeveloperDashboard";
import { UpgradeGate } from "@/components/shared/UpgradeGate";

export const metadata: Metadata = {
  title: "Developers | Conch",
  description: "Give your AI agents persistent memory and context through Conch's API.",
};

export default function DevelopersPage() {
  return (
    <UpgradeGate>
      <DeveloperDashboard />
    </UpgradeGate>
  );
}
