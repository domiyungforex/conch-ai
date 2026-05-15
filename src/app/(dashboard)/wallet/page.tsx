import { WalletConnectCard } from "@/components/wallet/WalletConnectCard";
import { ReputationCard } from "@/components/wallet/ReputationCard";

export default function WalletPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-semibold text-white">Wallet & Identity</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Connect a wallet to verify your on-chain identity and build reputation.
        </p>
      </div>
      <WalletConnectCard />
      <ReputationCard />
    </div>
  );
}
