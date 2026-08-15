"use client";

import Link from "next/link";
import { ResourcePanel } from "@/components/modules/ResourcePanel";
import type { AppwriteDoc, FinancialAccountDoc } from "@/lib/db";

type Account = AppwriteDoc<FinancialAccountDoc>;

export default function FinancialPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Financial Memory</h1>
        <p className="text-sm text-slate-400 mt-1">
          Your accounts and transactions, remembered through a provider-agnostic layer — nothing here moves money.
        </p>
      </div>

      <ResourcePanel<Account>
        basePath="/api/financial/accounts"
        title="Accounts"
        emptyLabel="No accounts yet — add one to start tracking transactions."
        fields={[
          { key: "provider", label: "Provider", type: "text", placeholder: "e.g. Chase, Manual" },
          { key: "accountType", label: "Account type", type: "text", placeholder: "checking, savings, wallet" },
          { key: "currency", label: "Currency", type: "text", placeholder: "USD" },
        ]}
        columns={[
          {
            key: "provider",
            label: "Provider",
            render: (a) => (
              <Link href={`/financial/${a.$id}`} className="text-coral-300 hover:text-coral-200 font-medium">
                {a.provider}
              </Link>
            ),
          },
          { key: "accountType", label: "Type" },
          { key: "currency", label: "Currency" },
        ]}
      />
    </div>
  );
}
