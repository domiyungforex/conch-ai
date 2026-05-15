"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { AgentSelector } from "@/components/chat/AgentSelector";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const router = useRouter();
  const [agentId, setAgentId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, input, setInput, isLoading, streamingContent, sendMessage, stop } = useChat({
    agentId,
    onConversationCreated: (id) => router.replace(`/chat/${id}`),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex h-full -m-4 md:-m-6 lg:-m-8">
      {/* Conversation sidebar */}
      <div className="hidden lg:flex flex-col w-64 border-r border-white/8 flex-shrink-0">
        <ConversationList />
      </div>

      {/* Chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-white">New Conversation</span>
          </div>
          <AgentSelector value={agentId} onChange={setAgentId} />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Start a conversation</h3>
              <p className="text-sm text-slate-400 max-w-sm">
                Ask me anything. I&apos;ll remember what matters and use it to help you better over time.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isStreaming={isLoading && i === messages.length - 1 && msg.role === "user" ? false : undefined}
            />
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

        {/* Input */}
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
