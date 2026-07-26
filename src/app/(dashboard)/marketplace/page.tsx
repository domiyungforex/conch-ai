"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GlassCard } from "@/components/shared/GlassCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import type { AppwriteDoc, MarketplaceListingDoc } from "@/lib/db";

type Listing = AppwriteDoc<MarketplaceListingDoc>;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load");
  return res.json();
}

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <Badge className="text-[10px] bg-white/5 text-slate-400 border-white/10 capitalize">{listing.type}</Badge>
        <Badge className="text-[10px] bg-coral-500/15 text-coral-300 border-coral-500/30">{listing.region}</Badge>
      </div>
      <h3 className="text-sm font-semibold text-white">{listing.title}</h3>
      <p className="text-xs text-slate-400 mt-1">{listing.description}</p>
    </GlassCard>
  );
}

function BrowseTab() {
  const { data, isLoading } = useQuery({ queryKey: ["marketplace", "browse"], queryFn: () => fetchJson<{ items: Listing[] }>("/api/marketplace") });
  if (isLoading) return <div className="h-24 animate-pulse bg-white/5 rounded-xl" />;
  if (!data?.items.length) return <p className="text-sm text-slate-400">No active listings yet.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {data.items.map((l) => <ListingCard key={l.$id} listing={l} />)}
    </div>
  );
}

function MineTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["marketplace", "mine"], queryFn: () => fetchJson<{ items: Listing[] }>("/api/marketplace/mine") });
  const [form, setForm] = useState({ title: "", description: "", type: "product", region: "global" });

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Failed to create");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketplace"] });
      setForm({ title: "", description: "", type: "product", region: "global" });
      toast({ title: "Listing created (draft)" });
    },
    onError: (err: Error) => toast({ title: "Couldn't create listing", description: err.message, variant: "destructive" }),
  });

  const publish = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/marketplace/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (!res.ok) throw new Error("Failed to publish");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketplace"] });
      toast({ title: "Listing published" });
    },
  });

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white">New listing</h3>
        <Input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="h-9 text-sm" />
        <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="text-sm" />
        <div className="flex gap-2">
          <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
            <SelectTrigger className="h-9 text-sm flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="opportunity">Opportunity</SelectItem>
            </SelectContent>
          </Select>
          <Select value={form.region} onValueChange={(v) => setForm((f) => ({ ...f, region: v }))}>
            <SelectTrigger className="h-9 text-sm flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="NG">Nigeria</SelectItem>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="UK">United Kingdom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="gap-1.5 h-8 text-xs" disabled={!form.title || create.isPending} onClick={() => create.mutate()}>
          {create.isPending && <LoadingSpinner size="sm" />}
          Save as draft
        </Button>
      </GlassCard>

      {isLoading ? (
        <div className="h-24 animate-pulse bg-white/5 rounded-xl" />
      ) : !data?.items.length ? (
        <p className="text-sm text-slate-400">You haven&apos;t listed anything yet.</p>
      ) : (
        <div className="space-y-2">
          {data.items.map((l) => (
            <GlassCard key={l.$id} className="p-4 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{l.title}</p>
                  <Badge className={l.status === "active" ? "text-[10px] bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "text-[10px] bg-slate-500/15 text-slate-300 border-slate-500/30"}>
                    {l.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{l.description}</p>
              </div>
              {l.status === "draft" && (
                <Button size="sm" variant="secondary" className="h-8 text-xs shrink-0" disabled={publish.isPending} onClick={() => publish.mutate(l.$id)}>
                  Publish
                </Button>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Marketplace</h1>
        <p className="text-sm text-slate-400 mt-1">Discover businesses, products, services, and opportunities.</p>
      </div>

      <Tabs defaultValue="browse">
        <TabsList className="glass border border-white/10 h-9">
          <TabsTrigger value="browse" className="text-xs px-3">Browse</TabsTrigger>
          <TabsTrigger value="mine" className="text-xs px-3">My Listings</TabsTrigger>
        </TabsList>
        <TabsContent value="browse" className="mt-4"><BrowseTab /></TabsContent>
        <TabsContent value="mine" className="mt-4"><MineTab /></TabsContent>
      </Tabs>
    </div>
  );
}
