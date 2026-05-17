"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Share2, Plus, Users, Lock, Globe, RefreshCw, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

interface SharedContext {
  id: string;
  name: string;
  description: string | null;
  memoryIds: string[];
  isPublic: boolean;
  shareToken: string;
  expiresAt: string | null;
  createdAt: string;
}

async function fetchSharedContexts(): Promise<SharedContext[]> {
  const res = await fetch("/api/shared-contexts");
  if (res.status === 404) return [];
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to load shared contexts");
  }
  const data = await res.json();
  return Array.isArray(data.sharedContexts) ? data.sharedContexts : [];
}

function SharedContextCard({ ctx }: { ctx: SharedContext }) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    const url = `${window.location.origin}/share/${ctx.shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <GlassCard className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {ctx.isPublic ? (
            <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <h3 className="font-semibold text-white text-sm leading-tight">{String(ctx.name)}</h3>
        </div>
        <Badge className={`text-xs shrink-0 ${ctx.isPublic ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-slate-500/15 text-slate-400 border-slate-500/30"}`}>
          {ctx.isPublic ? "Public" : "Private"}
        </Badge>
      </div>

      {ctx.description && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{String(ctx.description)}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {ctx.memoryIds.length} {ctx.memoryIds.length === 1 ? "memory" : "memories"}
        </div>
        <span>Created {formatDate(ctx.createdAt)}</span>
        {ctx.expiresAt && (
          <span className="text-amber-400">Expires {formatDate(ctx.expiresAt)}</span>
        )}
      </div>

      <div className="pt-1 border-t border-white/5">
        <Button
          variant="secondary"
          size="sm"
          onClick={copyLink}
          className="h-7 text-xs gap-1.5"
        >
          <Share2 className="w-3.5 h-3.5" />
          {copied ? "Link copied!" : "Copy share link"}
        </Button>
      </div>
    </GlassCard>
  );
}

export default function SharedContextsPage() {
  const { data: contexts, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["shared-contexts"],
    queryFn: fetchSharedContexts,
    staleTime: 30_000,
    retry: 1,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Shared Contexts</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Share memory collections with other users or applications.
          </p>
        </div>
        <Button className="gap-2" disabled>
          <Plus className="w-4 h-4" /> Share Context
        </Button>
      </div>

      {isError && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-white font-medium">Failed to load shared contexts</p>
            <p className="text-sm text-slate-400 mt-1">
              {(error as Error)?.message ?? "An unexpected error occurred."}
            </p>
          </div>
          <Button variant="secondary" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-2xl bg-white/5" />)}
        </div>
      )}

      {!isLoading && !isError && contexts?.length === 0 && (
        <EmptyState
          icon={Share2}
          title="No shared contexts yet"
          description="Share a collection of memories with others. They'll be able to read the context you choose to share."
        />
      )}

      {!isLoading && !isError && contexts && contexts.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contexts.map((ctx) => (
            <SharedContextCard key={ctx.id} ctx={ctx} />
          ))}
        </div>
      )}
    </div>
  );
}
