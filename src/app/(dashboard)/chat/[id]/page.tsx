"use client";

import { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { AgentSelector } from "@/components/chat/AgentSelector";
import { useChat } from "@/hooks/useChat";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConversationWithMessages } from "@/types/api";

async function fetchConversation(id: string): Promise<ConversationWithMessages> {
  const res = await fetch(`/api/conversations/${id}`);
  if (!res.ok) throw new Error("Failed to fetch conversation");
  return res.json();
}

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [agentId, setAgentId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const { data: conversation, isLoading: loadingConv } = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => fetchConversation(id),
  });

  const { messages, input, setInput, isLoading, streamingContent, sendMessage, stop, loadMessages } = useChat({
    conversationId: id,
    agentId,
    onConversationCreated: (newId) => router.replace(`/chat/${newId}`),
  });

  useEffect(() => {
    if (conversation?.messages && !initialized.current) {
      initialized.current = true;
      loadMessages(
        conversation.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          createdAt: m.createdAt,
        }))
      );
      setAgentId(conversation.agentId ?? null);
    }
  }, [conversation, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex h-full -m-4 md:-m-6 lg:-m-8">
      <div className="hidden lg:flex flex-col w-64 border-r border-white/8 flex-shrink-0">
        <ConversationList />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-white truncate max-w-[200px]">
              {loadingConv ? "Loading…" : (conversation?.title ?? "Conversation")}
            </span>
          </div>
          <AgentSelector value={agentId} onChange={setAgentId} />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {loadingConv && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl bg-white/5" />)}
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
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

        <div className="px-4 pb-4 flex-shrink-0">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={sendMessage}
            onStop={stop}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
