"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useWalletClient } from "wagmi";
import { EAS } from "@ethereum-attestation-service/eas-sdk";
import { toast } from "@/components/ui/toaster";
import { walletClientToSigner } from "@/lib/walletSigner";

interface PrepareResponse {
  encodedData: string;
  schemaUID: string;
  easContractAddress: string;
  recipient: string;
}

export function useVerifyMemory() {
  const qc = useQueryClient();
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const verify = useMutation({
    mutationFn: async (memoryId: string) => {
      if (!isConnected || !walletClient) {
        throw new Error("Connect a wallet first");
      }

      const prepRes = await fetch(`/api/memory/${memoryId}/verify/prepare`, { method: "POST" });
      if (!prepRes.ok) {
        const body = await prepRes.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Could not prepare verification");
      }
      const { encodedData, schemaUID, easContractAddress, recipient }: PrepareResponse = await prepRes.json();

      const signer = walletClientToSigner(walletClient);
      const eas = new EAS(easContractAddress);
      eas.connect(signer);

      // Opens the wallet's own approval UI — the user signs and pays gas
      // themselves. Nothing server-side ever holds a key or triggers this.
      const tx = await eas.attest({
        schema: schemaUID,
        data: { recipient, data: encodedData, revocable: true },
      });
      const attestationUid = await tx.wait();
      const txHash = tx.receipt?.hash ?? "";

      const confirmRes = await fetch(`/api/memory/${memoryId}/verify/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attestationUid, txHash }),
      });
      if (!confirmRes.ok) {
        const body = await confirmRes.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Attestation could not be confirmed");
      }
      return confirmRes.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["memories"] });
      toast({ title: "Verified on Base" });
    },
    onError: (err: Error) => {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    },
  });

  return verify;
}
