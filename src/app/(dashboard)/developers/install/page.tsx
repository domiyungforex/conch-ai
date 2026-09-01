import type { Metadata } from "next";
import { InstallConch } from "@/components/developers/InstallConch";
import { UpgradeGate } from "@/components/shared/UpgradeGate";

export const metadata: Metadata = {
  title: "Install Conch | Conch",
  description:
    "Install Conch SDK for JavaScript, TypeScript, Python, Go, Ruby, Rust, Java, PHP, and more. Connect your app to Conch's persistent context infrastructure.",
};

export default function InstallPage() {
  return (
    <UpgradeGate>
      <InstallConch />
    </UpgradeGate>
  );
}
