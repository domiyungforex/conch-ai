import { WalletConnectCard } from "@/components/wallet/WalletConnectCard";
import { ReputationCard } from "@/components/wallet/ReputationCard";

export default function WalletPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
      <div>
        <h1 className="font-display text-xl font-normal text-white">Wallet & Identity</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Anchor your memory to an on-chain identity. Verify, build reputation, and prove what you remember.
        </p>
      </div>
      <WalletConnectCard />
      <ReputationCard />
    </div>
  );
}
