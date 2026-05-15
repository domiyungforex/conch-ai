"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatRelativeTime, truncate } from "@/lib/utils";
import type { ConversationWithCount } from "@/types/api";

async function fetchConversations(): Promise<ConversationWithCount[]> {
  const res = await fetch("/api/conversations");
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json();
}

export function ConversationList() {
  const pathname = usePathname();
  const { data, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    staleTime: 30_000,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/8">
        <Button asChild size="sm" className="w-full justify-start gap-2">
          <Link href="/chat">
            <Plus className="w-4 h-4" />
            New Chat
          </Link>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          <div className="space-y-2 p-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl bg-white/5" />
            ))}
          </div>
        )}

        {data?.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs text-slate-500">No conversations yet</p>
          </div>
        )}

        {data?.map((conv) => {
          const active = pathname === `/chat/${conv.id}`;
          return (
            <Link
              key={conv.id}
              href={`/chat/${conv.id}`}
              className={cn(
                "flex flex-col gap-0.5 rounded-xl px-3 py-2.5 mb-1 transition-all text-left",
                active
                  ? "bg-violet-600/20 border border-violet-500/30"
                  : "hover:bg-white/5 border border-transparent"
              )}
            >
              <span className={cn("text-sm font-medium truncate", active ? "text-violet-200" : "text-slate-300")}>
                {truncate(conv.title ?? "New conversation", 32)}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">{formatRelativeTime(conv.updatedAt)}</span>
                <span className="text-xs text-slate-700">·</span>
                <span className="text-xs text-slate-600">{conv._count.messages} msgs</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
