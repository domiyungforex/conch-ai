"use client";

import { useState } from "react";
import { Plus, Brain, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { MemoryCard } from "@/components/memory/MemoryCard";
import { MemoryCreateDialog } from "@/components/memory/MemoryCreateDialog";
import { MemoryEditDialog } from "@/components/memory/MemoryEditDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { useMemory } from "@/hooks/useMemory";
import type { Memory, MemoryCategory } from "@prisma/client";

const CATEGORIES = ["ALL", "EPISODIC", "SEMANTIC", "PREFERENCE", "PROCEDURAL"] as const;

export default function MemoryPage() {
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Memory[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Memory | null>(null);

  const { data: memories, isLoading, archive, remove } = useMemory(category !== "ALL" ? category : undefined);

  const handleSearch = async () => {
    if (!search.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: search }),
      });
      const data = await res.json();
      setSearchResults(data.map((r: { memory: Memory }) => r.memory));
      setSearchQuery(search);
    } finally {
      setSearching(false);
    }
  };

  const displayed = searchResults ?? memories ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Memory</h1>
          <p className="text-sm text-slate-400 mt-0.5">Everything Conch knows about you</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Memory
        </Button>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={category} onValueChange={(v) => { setCategory(v); setSearchResults(null); setSearch(""); }}>
          <TabsList className="glass border border-white/10 h-9">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c} className="text-xs px-3 data-[state=active]:bg-violet-600/30 data-[state=active]:text-violet-200">
                {c === "ALL" ? "All" : c[0] + c.slice(1).toLowerCase()}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); if (!e.target.value) setSearchResults(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Semantic search…"
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
          {searchResults && (
            <Button variant="ghost" size="icon" onClick={() => { setSearchResults(null); setSearch(""); }}>
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button variant="secondary" onClick={handleSearch} disabled={!search.trim() || searching} className="shrink-0">
            {searching ? "Searching…" : "Search"}
          </Button>
        </div>
      </div>

      {searchResults && (
        <p className="text-sm text-slate-400">
          {searchResults.length} semantic results for &quot;{searchQuery}&quot;
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-44 rounded-2xl bg-white/5" />)}
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No memories yet"
          description="Add your first memory to help Conch understand you better."
          action={{ label: "Add Memory", onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((m) => (
            <MemoryCard
              key={m.id}
              memory={m}
              onEdit={setEditTarget}
              onArchive={(id) => archive.mutate(id)}
              onDelete={(id) => remove.mutate(id)}
            />
          ))}
        </div>
      )}

      <MemoryCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <MemoryEditDialog memory={editTarget} onClose={() => setEditTarget(null)} />
    </div>
  );
}
