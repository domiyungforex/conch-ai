"use client";

import { ResourcePanel } from "@/components/modules/ResourcePanel";
import type { AppwriteDoc, OpportunityDoc } from "@/lib/db";

type Opportunity = AppwriteDoc<OpportunityDoc>;

export default function OpportunitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Opportunity Engine</h1>
        <p className="text-sm text-slate-400 mt-1">
          Track opportunities with real evidence — every entry needs a source and a confidence level, never presented
          as certainty.
        </p>
      </div>

      <ResourcePanel<Opportunity>
        basePath="/api/opportunities"
        title="Opportunities"
        emptyLabel="No opportunities tracked yet."
        fields={[
          { key: "title", label: "Title", type: "text" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "evidenceJson", label: "Evidence (JSON)", type: "textarea", placeholder: '["Customer interviews", "Search trend data"]' },
          { key: "dataSourcesJson", label: "Data sources (JSON)", type: "textarea", placeholder: '["https://..."]' },
          { key: "riskFactorsJson", label: "Risk factors (JSON)", type: "textarea", placeholder: '["Regulatory uncertainty"]' },
          { key: "estimatedSizeUsd", label: "Estimated size (USD)", type: "number" },
          { key: "confidence", label: "Confidence (0-1)", type: "number", defaultValue: "0.5" },
        ]}
        columns={[
          { key: "title", label: "Title" },
          { key: "confidence", label: "Confidence", render: (o) => `${Math.round((o.confidence ?? 0) * 100)}%` },
          { key: "estimatedSizeUsd", label: "Est. size", render: (o) => o.estimatedSizeUsd ? `$${o.estimatedSizeUsd.toLocaleString()}` : "" },
          { key: "status", label: "Status" },
        ]}
      />
    </div>
  );
}
