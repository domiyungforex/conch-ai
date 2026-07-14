"use client";

import { useState } from "react";
import { Plus, Brain, Search, X, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { MemoryCard } from "@/components/memory/MemoryCard";
import { MemoryCreateDialog } from "@/components/memory/MemoryCreateDialog";
import { MemoryEditDialog } from "@/components/memory/MemoryEditDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { MemoryErrorBoundary } from "@/components/memory/MemoryErrorBoundary";
import { useMemory } from "@/hooks/useMemory";
import { toast } from "@/components/ui/toaster";
import type { MemoryDoc, AppwriteDoc } from "@/lib/db";
type Memory = AppwriteDoc<MemoryDoc>;

const CATEGORIES = ["ALL", "EPISODIC", "SEMANTIC", "PREFERENCE", "PROCEDURAL"] as const;

export default function MemoryPage() {
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Memory[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Memory | null>(null);

  const { data: memories, isLoading, isError, error, refetch, archive, remove } = useMemory(
    category !== "ALL" ? category : undefined
  );

  const handleSearch = async () => {
    if (!search.trim()) {
      setSearchResults(null);
      setSearchError(false);
      return;
    }
    setSearching(true);
    setSearchError(false);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: search }),
      });
      if (!res.ok) {
        setSearchError(true);
toast({ title: "Search failed", description: "Could not perform semantic search. Try again.", variant: "destructive" });
        return;
      }
      const data = await res.json();
      const results: Memory[] = Array.isArray(data.results)
        ? data.results.map((r: { memory: Memory }) => r.memory).filter(Boolean)
        : [];
      setSearchResults(results);
      setSearchQuery(search);
    } catch {
      setSearchError(true);
toast({ title: "Search failed", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchResults(null);
    setSearchError(false);
    setSearch("");
    setSearchQuery("");
  };

  const handleArchive = (id: string) => {
    archive.mutate(id, {
onError: () => toast({ title: "Archive failed", description: "Could not archive this memory.", variant: "destructive" }),
    });
  };

  const handleDelete = (id: string) => {
    remove.mutate(id, {
onError: () => toast({ title: "Delete failed", description: "Could not delete this memory.", variant: "destructive" }),
    });
  };

  const displayed: Memory[] = searchResults ?? memories ?? [];

  return (
    <MemoryErrorBoundary>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-normal text-white">Memory</h1>
            <p className="text-sm text-slate-400 mt-0.5">Everything Conch knows about you</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Memory
          </Button>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Tabs
            value={category}
            onValueChange={(v) => {
              setCategory(v);
              clearSearch();
            }}
          >
            <TabsList className="glass border border-white/10 h-9">
              {CATEGORIES.map((c) => (
                <TabsTrigger
                  key={c}
                  value={c}
                  className="text-xs px-3 data-[state=active]:bg-coral-600/30 data-[state=active]:text-coral-200"
                >
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
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (!e.target.value) clearSearch();
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Semantic search…"
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            {searchResults !== null && (
              <Button variant="ghost" size="icon" onClick={clearSearch}>
                <X className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={handleSearch}
              disabled={!search.trim() || searching}
              className="shrink-0"
            >
              {searching ? "Searching…" : "Search"}
            </Button>
          </div>
        </div>

        {searchResults !== null && !searchError && (
          <p className="text-sm text-slate-400">
            {searchResults.length} semantic result{searchResults.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
          </p>
        )}

        {/* Error state */}
        {isError && !searchResults && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-white font-medium">Failed to load memories</p>
              <p className="text-sm text-slate-400 mt-1">
                {(error as Error)?.message ?? "An unexpected error occurred."}
              </p>
            </div>
            <Button variant="secondary" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Retry
            </Button>
          </div>
        )}

        {/* Grid */}
        {!isError && (
          <>
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-44 rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : displayed.length === 0 ? (
              <EmptyState
                icon={Brain}
                title={searchResults !== null ? "No results found" : "No memories yet"}
                description={
                  searchResults !== null
                    ? "Try a different search term or browse by category."
                    : "Add your first memory to help Conch understand you better."
                }
                action={
                  searchResults !== null
                    ? { label: "Clear search", onClick: clearSearch }
                    : { label: "Add Memory", onClick: () => setCreateOpen(true) }
                }
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayed.map((m) =>
                  m?.$id ? (
                    <MemoryCard
                      key={m.$id}
                      memory={m}
                      onEdit={setEditTarget}
                      onArchive={handleArchive}
                      onDelete={handleDelete}
                    />
                  ) : null
                )}
              </div>
            )}
          </>
        )}

        <MemoryCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
        <MemoryEditDialog memory={editTarget} onClose={() => setEditTarget(null)} />
      </div>
    </MemoryErrorBoundary>
  );
}
