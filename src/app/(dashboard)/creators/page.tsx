"use client";

import Link from "next/link";
import { ResourcePanel } from "@/components/modules/ResourcePanel";
import { UpgradeGate } from "@/components/shared/UpgradeGate";
import { CreatorStageValues } from "@/lib/validators";
import type { AppwriteDoc, CreatorDoc } from "@/lib/db";

type Creator = AppwriteDoc<CreatorDoc>;

const STAGE_OPTIONS = CreatorStageValues.map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

export default function CreatorsPage() {
  return (
    <UpgradeGate>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Creator Memory</h1>
        <p className="text-sm text-slate-400 mt-1">
          Your creative memory. Songs, lyrics, unreleased ideas, campaigns, content, and collaborations, all remembered.
        </p>
      </div>

      <ResourcePanel<Creator>
        basePath="/api/creators"
        title="Your creator profiles"
        emptyLabel="No profiles yet. Add one to start building your creative memory."
        fields={[
          { key: "name", label: "Stage name / Brand", type: "text", placeholder: "e.g. Nia Sounds" },
          {
            key: "stage",
            label: "Stage",
            type: "select",
            defaultValue: "musician",
            options: STAGE_OPTIONS,
          },
          { key: "genre", label: "Genre / Niche", type: "text", placeholder: "e.g. Afrobeats" },
          { key: "brandIdentity", label: "Brand identity", type: "textarea", placeholder: "Sound, vibe, values, visuals…" },
          { key: "bio", label: "Bio", type: "textarea" },
        ]}
        columns={[
          {
            key: "name",
            label: "Name",
            render: (c) => (
              <Link href={`/creators/${c.$id}`} className="text-coral-300 hover:text-coral-200 font-medium">
                {c.name}
              </Link>
            ),
          },
          { key: "stage", label: "Stage" },
          { key: "genre", label: "Genre", render: (c) => c.genre ?? "" },
        ]}
      />
      </div>
    </UpgradeGate>
  );
}
