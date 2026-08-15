"use client";

import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResourcePanel } from "@/components/modules/ResourcePanel";
import { AssistantPanel } from "@/components/modules/AssistantPanel";
import type {
  AppwriteDoc, CreatorDoc, CreatorSongDoc, CreatorIdeaDoc,
  CreatorCampaignDoc, CreatorCollaboratorDoc, CreatorContentDoc,
} from "@/lib/db";
import {
  CreatorSongStatusValues, CreatorIdeaStatusValues, CreatorCampaignStatusValues,
} from "@/lib/validators";

async function fetchCreator(id: string): Promise<AppwriteDoc<CreatorDoc>> {
  const res = await fetch(`/api/creators/${id}`);
  if (!res.ok) throw new Error("Failed to load creator");
  const data = await res.json();
  return data.item;
}

const enumOptions = (values: readonly string[]) => values.map((v) => ({ value: v, label: v.replace(/_/g, " ") }));

export function CreatorDetailClient({ creatorId }: { creatorId: string }) {
  const { data: creator, isLoading, isError } = useQuery({
    queryKey: ["creator", creatorId],
    queryFn: () => fetchCreator(creatorId),
  });

  const base = `/api/creators/${creatorId}`;

  if (isLoading) return <div className="h-24 animate-pulse bg-white/5 rounded-xl" />;
  if (isError || !creator) return <p className="text-sm text-red-400">Couldn&apos;t load this creator.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">{creator.name}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {creator.stage} {creator.genre ? `· ${creator.genre}` : ""}
        </p>
        <p className="text-xs text-slate-500 mt-1">Songs, ideas, campaigns, and collaborators — all part of this creator&apos;s memory.</p>
      </div>

      <Tabs defaultValue="songs">
        <TabsList className="glass border border-white/10 h-9 flex-wrap h-auto">
          <TabsTrigger value="songs" className="text-xs px-3">Songs</TabsTrigger>
          <TabsTrigger value="ideas" className="text-xs px-3">Ideas</TabsTrigger>
          <TabsTrigger value="campaigns" className="text-xs px-3">Campaigns</TabsTrigger>
          <TabsTrigger value="collaborators" className="text-xs px-3">Collaborators</TabsTrigger>
          <TabsTrigger value="content" className="text-xs px-3">Content</TabsTrigger>
          <TabsTrigger value="assistant" className="text-xs px-3">AI Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="songs" className="mt-4">
          <ResourcePanel<AppwriteDoc<CreatorSongDoc>>
            basePath={`${base}/songs`}
            title="Songs"
            emptyLabel="No songs yet — add your catalogue (including unreleased work)."
            fields={[
              { key: "title", label: "Title", type: "text" },
              { key: "lyrics", label: "Lyrics", type: "textarea" },
              {
                key: "status", label: "Status", type: "select", defaultValue: "unreleased",
                options: enumOptions(CreatorSongStatusValues),
              },
              { key: "releaseDate", label: "Release date", type: "datetime" },
              { key: "notes", label: "Notes", type: "textarea", placeholder: "Producers, inspirations, etc." },
            ]}
            columns={[
              { key: "title", label: "Title" },
              { key: "status", label: "Status" },
              { key: "releaseDate", label: "Released", render: (s) => (s.releaseDate ? new Date(s.releaseDate).toLocaleDateString() : "—") },
            ]}
          />
        </TabsContent>

        <TabsContent value="ideas" className="mt-4">
          <ResourcePanel<AppwriteDoc<CreatorIdeaDoc>>
            basePath={`${base}/ideas`}
            title="Content ideas"
            emptyLabel="No ideas yet — capture concepts before they're forgotten."
            fields={[
              { key: "title", label: "Title", type: "text" },
              { key: "description", label: "Description", type: "textarea" },
              { key: "platform", label: "Platform", type: "text", placeholder: "TikTok, YouTube, Instagram…" },
              {
                key: "status", label: "Status", type: "select", defaultValue: "idea",
                options: enumOptions(CreatorIdeaStatusValues),
              },
            ]}
            columns={[
              { key: "title", label: "Title" },
              { key: "platform", label: "Platform", render: (i) => i.platform ?? "" },
              { key: "status", label: "Status" },
            ]}
          />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <ResourcePanel<AppwriteDoc<CreatorCampaignDoc>>
            basePath={`${base}/campaigns`}
            title="Campaigns"
            emptyLabel="No campaigns yet."
            fields={[
              { key: "name", label: "Name", type: "text" },
              { key: "goal", label: "Goal", type: "textarea" },
              { key: "platform", label: "Platform", type: "text" },
              { key: "budgetUsd", label: "Budget (USD)", type: "number" },
              {
                key: "status", label: "Status", type: "select", defaultValue: "planned",
                options: enumOptions(CreatorCampaignStatusValues),
              },
            ]}
            columns={[
              { key: "name", label: "Name" },
              { key: "platform", label: "Platform", render: (c) => c.platform ?? "" },
              { key: "budgetUsd", label: "Budget", render: (c) => `$${Number(c.budgetUsd ?? 0).toFixed(2)}` },
              { key: "status", label: "Status" },
            ]}
          />
        </TabsContent>

        <TabsContent value="collaborators" className="mt-4">
          <ResourcePanel<AppwriteDoc<CreatorCollaboratorDoc>>
            basePath={`${base}/collaborators`}
            title="Collaborators"
            emptyLabel="No collaborators yet — producers, managers, features…"
            fields={[
              { key: "name", label: "Name", type: "text" },
              { key: "role", label: "Role", type: "text", placeholder: "Producer, manager, feature…" },
              { key: "contact", label: "Contact", type: "text" },
              { key: "notes", label: "Notes", type: "textarea" },
            ]}
            columns={[
              { key: "name", label: "Name" },
              { key: "role", label: "Role", render: (c) => c.role ?? "" },
            ]}
          />
        </TabsContent>

        <TabsContent value="content" className="mt-4">
          <ResourcePanel<AppwriteDoc<CreatorContentDoc>>
            basePath={`${base}/content`}
            title="Published content"
            emptyLabel="No published content logged yet."
            fields={[
              { key: "title", label: "Title", type: "text" },
              { key: "platform", label: "Platform", type: "text" },
              { key: "url", label: "URL", type: "text", placeholder: "https://" },
              { key: "publishedAt", label: "Published", type: "datetime" },
              { key: "notes", label: "Notes", type: "textarea", placeholder: "Audience insights, performance…" },
            ]}
            columns={[
              { key: "title", label: "Title" },
              { key: "platform", label: "Platform", render: (c) => c.platform ?? "" },
              { key: "publishedAt", label: "Published", render: (c) => (c.publishedAt ? new Date(c.publishedAt).toLocaleDateString() : "—") },
            ]}
          />
        </TabsContent>

        <TabsContent value="assistant" className="mt-4">
          <AssistantPanel
            askPath={`${base}/ask`}
            placeholder="e.g. Give me five TikTok ideas based on my previous songs"
            hint="The assistant answers from this creator's own records — songs, ideas, campaigns, collaborators, and content — plus brand identity. It won't invent anything not in the records."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
