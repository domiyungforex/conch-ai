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
    <div className="flex flex-col h-full bg-background">
      {/* New chat button */}
      <div className="p-3 border-b border-border">
        <Button asChild size="sm" className="w-full justify-start gap-2 chat-btn-primary text-[13px] h-9">
          <Link href="/chat">
            <Plus className="w-4 h-4" />
            New Chat
          </Link>
        </Button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto chat-scroll p-2">
        {isLoading && (
          <div className="space-y-1.5 p-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 rounded-xl chat-skeleton" />
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-center px-4">
            <MessageSquare className="w-5 h-5 chat-text-muted" />
            <p className="text-[12px] chat-text-muted">{(error as Error)?.message ?? "Could not load conversations"}</p>
            <button
              type="button"
              onClick={() => qc.invalidateQueries({ queryKey: ["conversations"] })}
              className="text-[12px] text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <MessageSquare className="w-6 h-6 chat-text-muted mb-1.5" />
            <p className="text-[12px] chat-text-muted">No conversations yet</p>
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
                "group relative rounded-xl mb-0.5 transition-colors duration-100",
                active ? "bg-primary/10" : "hover:bg-card"
              )}
            >
              <Link href={`/chat/${conv.$id}`} className="flex-1 flex flex-col gap-0.5 px-3 py-2.5 block">
                <span className={cn("text-[13px] font-medium truncate pr-6", active ? "text-primary" : "chat-text-primary")}>
                  {truncate(conv.title ?? "New conversation", 30)}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] chat-text-muted">{formatRelativeTime(updatedAt)}</span>
                  <span className="text-[11px] chat-text-muted">·</span>
                  <span className="text-[11px] chat-text-muted">{msgCount}</span>
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
                aria-label="Delete"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center chat-btn-ghost hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              >
                {deleting ? <LoadingSpinner size="sm" /> : <Trash2 className="w-3 h-3" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
