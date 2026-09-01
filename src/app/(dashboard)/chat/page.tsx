"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Sparkles, Brain, Zap, PanelLeft } from "lucide-react";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { AgentSelector } from "@/components/chat/AgentSelector";
import { ChatErrorBoundary } from "@/components/chat/ChatErrorBoundary";
import { UpgradeGate } from "@/components/shared/UpgradeGate";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const router = useRouter();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { messages, input, setInput, isLoading, sendMessage, stop, retryLast } = useChat({
    agentId,
    onConversationCreated: (id) => router.replace(`/chat/${id}`),
  });

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

  const hasMessages = messages.length > 0;

  return (
    <ChatErrorBoundary>
    <UpgradeGate>
    <div className="flex h-full">
      {/* Sidebar */}
      {showSidebar && (
        <div className="hidden lg:flex flex-col shrink-0 w-[280px] border-r border-border animate-[slideInLeft_0.15s_ease-out]">
          <ConversationList />
        </div>
      )}

      {/* Main chat area */}
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
            <span className="text-[13px] font-medium chat-text-primary">
              {hasMessages ? "Chat" : "New Chat"}
            </span>
          </div>
          <AgentSelector value={agentId} onChange={setAgentId} />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto chat-scroll">
          <div className="max-w-2xl mx-auto px-4 py-6">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg shadow-primary/20">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <h1 className="text-2xl font-semibold chat-text-primary mb-1">What can I help with?</h1>
                  <p className="text-[14px] chat-text-muted">I remember everything. Ask me anything.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { icon: Brain, label: "What do you remember?", color: "text-primary" },
                    { icon: Zap, label: "Help me brainstorm", color: "text-warning" },
                    { icon: Sparkles, label: "Create something new", color: "text-secondary" },
                  ].map(({ icon: Icon, label, color }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setInput(label)}
                      className="chat-quick-action flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] transition-all duration-150"
                    >
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
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
            />
          </div>
        </div>
      </div>
    </div>
    </UpgradeGate>
    </ChatErrorBoundary>
  );
}
