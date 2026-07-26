"use client";

import { use } from "react";
import { ResourcePanel } from "@/components/modules/ResourcePanel";
import type { AppwriteDoc, FinancialTransactionDoc } from "@/lib/db";

type Transaction = AppwriteDoc<FinancialTransactionDoc>;

export default function FinancialAccountPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = use(params);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Transactions</h1>
        <p className="text-sm text-slate-400 mt-1">All entries for this account.</p>
      </div>

      <ResourcePanel<Transaction>
        basePath={`/api/financial/accounts/${accountId}/transactions`}
        title="Transactions"
        emptyLabel="No transactions yet."
        fields={[
          { key: "amountUsd", label: "Amount (USD)", type: "number", placeholder: "Negative for outflow" },
          { key: "category", label: "Category", type: "text" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "occurredAt", label: "Date", type: "datetime" },
          { key: "source", label: "Source", type: "text", placeholder: "manual" },
        ]}
        columns={[
          { key: "occurredAt", label: "Date", render: (t) => new Date(t.occurredAt).toLocaleDateString() },
          { key: "category", label: "Category", render: (t) => t.category ?? "—" },
          { key: "description", label: "Description", render: (t) => t.description ?? "—" },
          {
            key: "amountUsd",
            label: "Amount",
            render: (t) => (
              <span className={t.amountUsd < 0 ? "text-red-400" : "text-emerald-400"}>
                {t.amountUsd < 0 ? "-" : "+"}${Math.abs(t.amountUsd).toFixed(2)}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
