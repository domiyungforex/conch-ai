"use client";

import Link from "next/link";
import { ResourcePanel } from "@/components/modules/ResourcePanel";
import type { AppwriteDoc, BusinessDoc } from "@/lib/db";

type Business = AppwriteDoc<BusinessDoc>;

export default function BusinessPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Business AI</h1>
        <p className="text-sm text-slate-400 mt-1">
          Your business workspace — customers, suppliers, products, orders, inventory, expenses, and revenue.
        </p>
      </div>

      <ResourcePanel<Business>
        basePath="/api/business"
        title="Your businesses"
        emptyLabel="No businesses yet — add one to get started."
        fields={[
          { key: "name", label: "Name", type: "text", placeholder: "Acme Inc." },
          { key: "industry", label: "Industry", type: "text", placeholder: "Retail" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "website", label: "Website", type: "text", placeholder: "https://" },
          {
            key: "region",
            label: "Region",
            type: "select",
            defaultValue: "global",
            options: [
              { value: "global", label: "Global" },
              { value: "CA", label: "Canada" },
              { value: "NG", label: "Nigeria" },
              { value: "US", label: "United States" },
              { value: "UK", label: "United Kingdom" },
            ],
          },
        ]}
        columns={[
          {
            key: "name",
            label: "Name",
            render: (b) => (
              <Link href={`/business/${b.$id}`} className="text-coral-300 hover:text-coral-200 font-medium">
                {b.name}
              </Link>
            ),
          },
          { key: "industry", label: "Industry", render: (b) => b.industry ?? "" },
          { key: "region", label: "Region" },
          { key: "currency", label: "Currency" },
        ]}
      />
    </div>
  );
}
