"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Brain, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MemoryCard } from "@/components/memory/MemoryCard";
import { MemoryEditDialog } from "@/components/memory/MemoryEditDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "@/components/ui/toaster";
import { useMemory } from "@/hooks/useMemory";
import { useVerifyMemory } from "@/hooks/useVerifyMemory";
import type { MemoryDoc, AppwriteDoc } from "@/lib/db";
import Link from "next/link";

type Memory = AppwriteDoc<MemoryDoc>;

interface SearchResult {
  memory: Memory;
  score: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [editTarget, setEditTarget] = useState<Memory | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const { data: memories, archive, remove } = useMemory();
  const verify = useVerifyMemory();

  // Auto-focus search input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (!res.ok) {
        toast({ title: "Search failed", description: "Could not perform semantic search. Try again.", variant: "destructive" });
        return;
      }
      const data = await res.json();
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch {
      toast({ title: "Search failed", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  }, [query]);

  const clearSearch = () => {
    setQuery("");
    setResults(null);
    inputRef.current?.focus();
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

  // Show recent memories if no search has been performed
  const displayMemories: Memory[] = results !== null
    ? results.map((r) => r.memory).filter(Boolean)
    : [];

  const recentMemories = memories?.slice(0, 6) ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-normal text-foreground">Search</h1>
        <p className="text-sm text-slate-500 mt-0.5">Semantic search across all your memories</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
            if (e.key === "Escape") clearSearch();
          }}
          placeholder="Search your memories…"
          className="pl-10 pr-20 sm:pr-24 h-11 text-[15px] rounded-xl"
        />
        <div className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-1.5">
          {query && (
            <Button variant="ghost" size="icon" onClick={clearSearch} className="h-7 w-7">
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSearch}
            disabled={!query.trim() || searching}
            className="h-7 gap-1.5"
          >
            {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            Search
          </Button>
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      {results === null && (
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-600 px-4">
          <kbd className="px-1.5 py-0.5 rounded bg-muted/50 border border-border font-mono">⌘K</kbd>
          <span>to search from anywhere</span>
        </div>
      )}

      {/* Results */}
      {results !== null && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{query}&quot;
            </p>
            <Button variant="ghost" size="sm" onClick={clearSearch} className="gap-1.5 text-xs">
              <X className="w-3 h-3" /> Clear
            </Button>
          </div>

          {results.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No results found"
              description="Try a different search term or check your spelling."
              action={{ label: "Clear search", onClick: clearSearch }}
            />
          ) : (
            <div className="space-y-2">
              {results.map(({ memory, score }) => (
                <div key={memory.$id} className="group relative">
                  <div className="absolute -left-3 top-4 text-[10px] font-mono text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(score * 100).toFixed(0)}%
                  </div>
                  <MemoryCard
                    memory={memory}
                    onEdit={setEditTarget}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                    onVerify={(id) => verify.mutate(id)}
                    verifying={verify.isPending && verify.variables === memory.$id}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent memories (when no search) */}
      {results === null && (
        <div className="space-y-4">
          {recentMemories.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Recent memories</p>
                <Link
                  href="/memory"
                  className="text-xs text-primary hover:text-primary-hover transition-colors flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {recentMemories.map((m) =>
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
            </>
          )}

          {recentMemories.length === 0 && (
            <EmptyState
              icon={Brain}
              title="No memories yet"
              description="Start chatting or add memories to make them searchable."
              action={{ label: "Go to Chat", onClick: () => router.push("/chat") }}
            />
          )}
        </div>
      )}

      <MemoryEditDialog memory={editTarget} onClose={() => setEditTarget(null)} />
    </div>
  );
}
