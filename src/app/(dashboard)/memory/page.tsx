"use client";

import { useState } from "react";
import { Plus, Brain, Search, X, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { MemoryCard } from "@/components/memory/MemoryCard";
import { MemoryGraph } from "@/components/memory/MemoryGraph";
import { MemoryCreateDialog } from "@/components/memory/MemoryCreateDialog";
import { MemoryEditDialog } from "@/components/memory/MemoryEditDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { UpgradeGate } from "@/components/shared/UpgradeGate";
import { MemoryErrorBoundary } from "@/components/memory/MemoryErrorBoundary";
import { useMemory } from "@/hooks/useMemory";
import { useVerifyMemory } from "@/hooks/useVerifyMemory";
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
  const [view, setView] = useState<"list" | "graph">("list");

  const { data: memories, isLoading, isError, error, refetch, archive, remove } = useMemory(
    category !== "ALL" ? category : undefined
  );
  const verify = useVerifyMemory();

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
      <UpgradeGate>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-normal text-foreground">Memory</h1>
            <p className="text-xs sm:text-sm chat-text-muted mt-0.5">Everything you&apos;ve shared, recalled when needed</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5 shrink-0">
            <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Add Memory</span><span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1 bg-card rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                view === "list" ? "bg-card-hover text-foreground" : "chat-text-muted hover:text-foreground"
              )}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setView("graph")}
              className={cn(
                "px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                view === "graph" ? "bg-card-hover text-foreground" : "chat-text-muted hover:text-foreground"
              )}
            >
              Graph
            </button>
          </div>

          <div className="overflow-x-auto -mx-1 px-1">
            <Tabs
              value={category}
              onValueChange={(v) => {
                setCategory(v);
                clearSearch();
              }}
            >
              <TabsList className="bg-card h-8">
                {CATEGORIES.map((c) => (
                  <TabsTrigger
                    key={c}
                    value={c}
                    className="text-[11px] px-2.5 whitespace-nowrap data-[state=active]:bg-card-hover data-[state=active]:text-foreground"
                  >
                    {c === "ALL" ? "All" : c[0] + c.slice(1).toLowerCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 chat-text-muted" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (!e.target.value) clearSearch();
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search memories…"
                className="pl-8 h-8 text-[13px]"
              />
            </div>
            {searchResults !== null && (
              <Button variant="ghost" size="icon" onClick={clearSearch} className="h-8 w-8">
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSearch}
              disabled={!search.trim() || searching}
              className="shrink-0 h-8"
            >
              {searching ? "Searching…" : "Search"}
            </Button>
          </div>
        </div>

        {searchResults !== null && !searchError && (
          <p className="text-sm chat-text-muted">
            {searchResults.length} semantic result{searchResults.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
          </p>
        )}

        {/* Error state */}
        {isError && !searchResults && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-sm font-medium text-foreground">Failed to load memories</p>
              <p className="text-xs chat-text-muted mt-1">
                {(error as Error)?.message ?? "An unexpected error occurred."}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => refetch()} className="gap-1.5">
              <RefreshCw className="w-3 h-3" /> Retry
            </Button>
          </div>
        )}

        {/* Graph View */}
        {view === "graph" && !isError && (
          <MemoryGraph />
        )}

        {/* Grid */}
        {view === "list" && !isError && (
          <>
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-40 rounded-xl chat-skeleton" />
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
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayed.map((m) =>
                  m?.$id ? (
                    <MemoryCard
                      key={m.$id}
                      memory={m}
                      onEdit={setEditTarget}
                      onArchive={handleArchive}
                      onDelete={handleDelete}
                      onVerify={(id) => verify.mutate(id)}
                      verifying={verify.isPending && verify.variables === m.$id}
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
      </UpgradeGate>
    </MemoryErrorBoundary>
  );
}
