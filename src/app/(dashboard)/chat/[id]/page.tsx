"use client";

import { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, AlertCircle, RefreshCw } from "lucide-react";
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const { data: conversation, isLoading: loadingConv, isError: convError, error: convErr, refetch } = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => fetchConversation(id),
    retry: 2,
    staleTime: 30_000,
  });

  const { messages, input, setInput, isLoading, streamingContent, sendMessage, stop, loadMessages, retryLast } = useChat({
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const title = conversation?.title ?? (loadingConv ? "Loading…" : "Conversation");

  return (
    <UpgradeGate>
    <ChatErrorBoundary>
      <div className="flex h-full -m-4 md:-m-6 lg:-m-8">
        <div className="hidden lg:flex flex-col w-64 border-r border-white/8 shrink-0">
          <ConversationList />
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-coral-400" />
              <span className="text-sm font-medium text-white truncate max-w-50">
                {title}
              </span>
            </div>
            <AgentSelector value={agentId} onChange={setAgentId} />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {loadingConv && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-2xl bg-white/5" />
                ))}
              </div>
            )}

            {convError && !loadingConv && (
              <div className="flex flex-col items-center justify-center h-40 gap-4 text-center">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Could not load conversation</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {(convErr as Error)?.message ?? "An error occurred"}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => refetch()} className="gap-2">
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </Button>
              </div>
            )}

            {!loadingConv && !convError && messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} onRetry={msg.isError ? retryLast : undefined} />
            ))}

            {isLoading && (
              <ChatMessage
                message={{ id: "streaming", role: "assistant", content: "", createdAt: new Date() }}
                isStreaming
                streamingContent={streamingContent}
              />
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 pb-4 shrink-0">
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
    </ChatErrorBoundary>
    </UpgradeGate>
  );
}
