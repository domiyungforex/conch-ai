"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, Brain, MessageSquare, ArrowRight, CornerDownLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MemoryDoc, AppwriteDoc } from "@/lib/db";

type Memory = AppwriteDoc<MemoryDoc>;

interface SearchResult {
  memory: Memory;
  score: number;
}

const QUICK_LINKS = [
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Memory", href: "/memory", icon: Brain },
  { label: "Search", href: "/search", icon: Search },
];

export function CmdKSearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      // Small delay so the DOM is painted
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Close on escape or click outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query.trim(), topK: 5 }),
        });
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data.results) ? data.results : []);
        }
      } catch {
        // Silently fail in the quick search dialog
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Build combined list: quick links + search results
  const totalItems = QUICK_LINKS.length + results.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex < QUICK_LINKS.length) {
        router.push(QUICK_LINKS[selectedIndex].href);
        setOpen(false);
      } else if (results[selectedIndex - QUICK_LINKS.length]) {
        const mem = results[selectedIndex - QUICK_LINKS.length].memory;
        router.push(`/memory?highlight=${mem.$id}`);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-lg glass-strong border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/6">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search memories, or type a command…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-slate-500 outline-none"
          />
          {searching && <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />}
          {query && !searching && (
            <button onClick={() => { setQuery(""); setResults([]); }} className="text-slate-500 hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto p-2">
          {/* Quick links */}
          {!query && (
            <div className="mb-1">
              <p className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Navigate</p>
              {QUICK_LINKS.map((link, i) => (
                <button
                  key={link.href}
                  onClick={() => { router.push(link.href); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors",
                    selectedIndex === i
                      ? "bg-coral-500/15 text-foreground"
                      : "text-slate-400 hover:text-foreground hover:bg-white/[0.04]"
                  )}
                >
                  <link.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{link.label}</span>
                  <CornerDownLeft className="w-3 h-3 text-slate-600" />
                </button>
              ))}
            </div>
          )}

          {/* Search results */}
          {query && results.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Memories</p>
              {results.map(({ memory, score }, i) => {
                const idx = QUICK_LINKS.length + i;
                return (
                  <button
                    key={memory.$id}
                    onClick={() => {
                      router.push(`/memory?highlight=${memory.$id}`);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left",
                      idx === selectedIndex
                        ? "bg-coral-500/15 text-foreground"
                        : "text-slate-400 hover:text-foreground hover:bg-white/[0.04]"
                    )}
                  >
                    <Brain className="w-4 h-4 shrink-0 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[13px]">{memory.content}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {memory.category} · {(score * 100).toFixed(0)}% match
                      </p>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {/* No results */}
          {query && !searching && results.length === 0 && (
            <div className="px-3 py-6 text-center">
              <p className="text-sm text-slate-500">No memories found for &quot;{query}&quot;</p>
              <p className="text-[11px] text-slate-600 mt-1">Try different keywords</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/6 text-[10px] text-slate-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted/50 border border-border font-mono">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted/50 border border-border font-mono">↵</kbd>
              select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-muted/50 border border-border font-mono">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
