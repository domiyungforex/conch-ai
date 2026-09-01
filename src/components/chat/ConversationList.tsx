"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, MessageSquare, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { toast } from "@/components/ui/toaster";
import { cn, formatRelativeTime, truncate } from "@/lib/utils";
import type { ConversationWithCount } from "@/types/api";

interface ConversationListResponse {
  conversations: ConversationWithCount[];
  total: number;
  page: number;
  limit: number;
}

async function fetchConversations(): Promise<ConversationWithCount[]> {
  const res = await fetch("/api/conversations");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to fetch conversations");
  }
  const data: ConversationListResponse = await res.json();
  return Array.isArray(data.conversations) ? data.conversations : [];
}

async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to delete conversation");
  }
}

export function ConversationList() {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    staleTime: 30_000,
    retry: 2,
  });

  const remove = useMutation({
    mutationFn: deleteConversation,
    onSuccess: (_data, deletedId) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      toast({ title: "Conversation deleted" });
      if (pathname === `/chat/${deletedId}`) router.push("/chat");
    },
    onError: (err: Error) => toast({ title: "Failed to delete conversation", description: err.message, variant: "destructive" }),
  });

  const conversations: ConversationWithCount[] = Array.isArray(data) ? data : [];

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

        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-center px-4">
            <MessageSquare className="w-6 h-6 text-slate-600" />
            <p className="text-xs text-slate-500">
              {(error as Error)?.message ?? "Could not load conversations"}
            </p>
            <button
              type="button"
              onClick={() => qc.invalidateQueries({ queryKey: ["conversations"] })}
              className="text-xs text-coral-400 hover:text-coral-300 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs text-slate-500">No conversations yet</p>
          </div>
        )}

        {conversations.map((conv) => {
          if (!conv?.$id) return null;
          const active = pathname === `/chat/${conv.$id}`;
          const msgCount = conv._count?.messages ?? 0;
          const updatedAt = conv.$updatedAt ? new Date(conv.$updatedAt) : new Date();
          const deleting = remove.isPending && remove.variables === conv.$id;

          return (
            <div
              key={conv.$id}
              className={cn(
                "group relative flex items-center rounded-xl mb-1 transition-all",
                active
                  ? "bg-coral-600/20 border border-coral-500/30"
                  : "hover:bg-white/5 border border-transparent"
              )}
            >
              <Link href={`/chat/${conv.$id}`} className="flex-1 min-w-0 flex flex-col gap-0.5 px-3 py-2.5">
                <span className={cn("text-sm font-medium truncate pr-6", active ? "text-coral-200" : "text-slate-300")}>
                  {truncate(conv.title ?? "New conversation", 32)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">{formatRelativeTime(updatedAt)}</span>
                  <span className="text-xs text-slate-700">·</span>
                  <span className="text-xs text-slate-600">{msgCount} msgs</span>
                </div>
              </Link>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!deleting) remove.mutate(conv.$id);
                }}
                disabled={deleting}
                aria-label="Delete conversation"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              >
                {deleting ? <LoadingSpinner size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
