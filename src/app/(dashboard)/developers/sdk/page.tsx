import type { Metadata } from "next";
import { SdkDocs } from "@/components/developers/SdkDocs";
import { UpgradeGate } from "@/components/shared/UpgradeGate";

export const metadata: Metadata = {
  title: "SDK Documentation | Conch",
  description:
    "Comprehensive documentation for the Conch TypeScript/JavaScript SDK. Types, methods, examples, and best practices.",
};

export default function SdkDocsPage() {
  return (
    <UpgradeGate>
      <SdkDocs />
    </UpgradeGate>
  );
}
