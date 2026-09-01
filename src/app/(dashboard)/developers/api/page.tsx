import type { Metadata } from "next";
import { ApiDocsConsole } from "@/components/developers/ApiDocsConsole";
import { UpgradeGate } from "@/components/shared/UpgradeGate";

export const metadata: Metadata = {
  title: "API Reference | Conch",
  description:
    "Live, interactive documentation for the Conch API: Memory, Search, Chat, Agents, Billing, Wallet, and more.",
};

export default function ApiReferencePage() {
  return (
    <UpgradeGate>
      <ApiDocsConsole />
    </UpgradeGate>
  );
}
