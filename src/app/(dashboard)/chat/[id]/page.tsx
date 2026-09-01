"use client";

import { useState, useRef, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, AlertCircle, RefreshCw, PanelLeft } from "lucide-react";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { AgentSelector } from "@/components/chat/AgentSelector";
import { ChatErrorBoundary } from "@/components/chat/ChatErrorBoundary";
import { UpgradeGate } from "@/components/shared/UpgradeGate";
import { useChat } from "@/hooks/useChat";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { ConversationWithMessages } from "@/types/api";

interface ConversationResponse {
  conversation: ConversationWithMessages;
}

async function fetchConversation(id: string): Promise<ConversationWithMessages> {
  const res = await fetch(`/api/conversations/${id}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to load conversation");
  }
  const data: ConversationResponse = await res.json();
  if (!data.conversation) throw new Error("Conversation not found");
  return data.conversation;
}

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: conversation, isLoading: loadingConv, isError: convError, error: convErr, refetch } = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => fetchConversation(id),
    retry: 2,
    staleTime: 30_000,
  });

  const { messages, input, setInput, isLoading, sendMessage, stop, loadMessages, retryLast } = useChat({
    conversationId: id,
    agentId,
    onConversationCreated: (newId) => router.replace(`/chat/${newId}`),
  });

  useEffect(() => {
    if (conversation?.messages && !initialized.current) {
      initialized.current = true;
      loadMessages(
        (conversation.messages ?? []).map((m) => ({
          id: m.$id,
          role: m.role as "user" | "assistant",
          content: m.content ?? "",
          memoryIds: Array.isArray((m as { memoryIds?: string[] }).memoryIds)
            ? (m as { memoryIds?: string[] }).memoryIds
            : [],
          createdAt: m.$createdAt ? new Date(m.$createdAt) : new Date(),
        }))
      );
      setAgentId((conversation as { agentId?: string | null }).agentId ?? null);
    }
  }, [conversation, loadMessages]);

  const scrollToBottom = useCallback(() => {
    const el = bottomRef.current;
    if (!el) return;
    const container = el.closest(".overflow-y-auto");
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
      if (!isNearBottom) return;
    }
    el.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(scrollToBottom, 100);
    return () => { if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current); };
  }, [messages, scrollToBottom]);

  const title = conversation?.title ?? (loadingConv ? "Loading…" : "Conversation");

  return (
    <UpgradeGate>
    <ChatErrorBoundary>
      <div className="flex h-full">
        {/* Sidebar */}
        {showSidebar && (
          <div className="hidden lg:flex flex-col shrink-0 w-[280px] border-r border-border animate-[slideInLeft_0.15s_ease-out]">
            <ConversationList />
          </div>
        )}

        {/* Main */}
        <div className="flex flex-col flex-1 min-w-0 bg-background">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-border">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSidebar(!showSidebar)}
                className="hidden lg:flex items-center gap-1.5 text-[13px] chat-text-muted hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-card"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-[13px] font-medium chat-text-primary truncate max-w-[200px]">{title}</span>
            </div>
            <AgentSelector value={agentId} onChange={setAgentId} />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto chat-scroll">
            <div className="max-w-2xl mx-auto px-4 py-6">
              {loadingConv && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-2xl chat-skeleton" />
                  ))}
                </div>
              )}

              {convError && !loadingConv && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm chat-text-primary font-medium">Could not load conversation</p>
                    <p className="text-xs chat-text-muted mt-1">{(convErr as Error)?.message ?? "An error occurred"}</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => refetch()} className="gap-1.5">
                    <RefreshCw className="w-3 h-3" /> Retry
                  </Button>
                </div>
              )}

              {!loadingConv && !convError && messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} onRetry={msg.isError ? retryLast : undefined} />
              ))}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border">
            <div className="max-w-2xl mx-auto px-4 py-3">
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={sendMessage}
                onStop={stop}
                isLoading={isLoading}
                disabled={loadingConv || convError}
              />
            </div>
          </div>
        </div>
      </div>
    </ChatErrorBoundary>
    </UpgradeGate>
  );
}
