"use client";

import { ResourcePanel } from "@/components/modules/ResourcePanel";
import type { AppwriteDoc, EconomicSignalDoc } from "@/lib/db";

type Signal = AppwriteDoc<EconomicSignalDoc>;

export default function EconomicPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Economic Memory</h1>
        <p className="text-sm text-slate-400 mt-1">
          Market signals, remembered with their source, confidence, and methodology. Analysis, not certainty.
          Curated by the Conch team; nothing here is generated automatically yet.
        </p>
      </div>

      <ResourcePanel<Signal>
        basePath="/api/economic/signals"
        title="Signals"
        emptyLabel="No signals published yet."
        readOnly
        fields={[]}
        columns={[
          { key: "title", label: "Signal" },
          { key: "category", label: "Category" },
          { key: "region", label: "Region" },
          { key: "confidence", label: "Confidence", render: (s) => `${Math.round((s.confidence ?? 0) * 100)}%` },
          { key: "source", label: "Source" },
          { key: "observedAt", label: "Observed", render: (s) => new Date(s.observedAt).toLocaleDateString() },
        ]}
      />
    </div>
  );
}
