"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Sparkles, Brain, Zap, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { AgentSelector } from "@/components/chat/AgentSelector";
import { SuggestedPrompts } from "@/components/chat/SuggestedPrompts";
import { ChatErrorBoundary } from "@/components/chat/ChatErrorBoundary";
import { UpgradeGate } from "@/components/shared/UpgradeGate";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const router = useRouter();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, input, setInput, isLoading, streamingContent, sendMessage, stop, retryLast } = useChat({
    agentId,
    onConversationCreated: (id) => router.replace(`/chat/${id}`),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const hasMessages = messages.length > 0;

  return (
    <ChatErrorBoundary>
    <UpgradeGate>
    <div className="flex h-full">
      {/* Conversation sidebar — toggleable on mobile */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden lg:flex flex-col border-r border-white/[0.04] bg-[#0a0a0f] shrink-0 overflow-hidden"
          >
            <ConversationList />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat area — full screen */}
      <div className="flex flex-col flex-1 min-w-0 bg-[#0a0a0f]">
        {/* Minimal header */}
        <div className="flex items-center justify-between px-3 sm:px-6 h-14 shrink-0 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSidebar(!showSidebar)}
              className="hidden lg:flex items-center gap-2 text-[13px] text-slate-500 hover:text-white transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{hasMessages ? "Continue" : "New Chat"}</span>
            </button>
          </div>
          <AgentSelector value={agentId} onChange={setAgentId} />
        </div>

        {/* Messages — centered, max-width */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8">
            <AnimatePresence mode="popLayout">
              {messages.length === 0 && !isLoading && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex flex-col items-center justify-center min-h-[60vh] gap-8"
                >
                  {/* Hero */}
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.5 }}
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mb-6 mx-auto shadow-2xl shadow-violet-500/30"
                    >
                      <Brain className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-semibold text-white mb-2">
                      What can I help with?
                    </h1>
                    <p className="text-slate-500 text-[15px]">
                      I remember everything. Ask me anything.
                    </p>
                  </div>

                  {/* Quick actions */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      { icon: Brain, label: "What do you remember?", color: "text-violet-400" },
                      { icon: Zap, label: "Help me brainstorm", color: "text-amber-400" },
                      { icon: Sparkles, label: "Create something new", color: "text-cyan-400" },
                    ].map(({ icon: Icon, label, color }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setInput(label)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[13px] text-slate-400 hover:text-white hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-200"
                      >
                        <Icon className={`w-4 h-4 ${color}`} />
                        {label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {messages.map((msg, i) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isStreaming={isLoading && i === messages.length - 1 && msg.role === "user" ? false : undefined}
                onRetry={msg.isError ? retryLast : undefined}
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
        </div>

        {/* Input — centered at bottom */}
        <div className="shrink-0 pb-4 sm:pb-6 pt-2">
          <div className="max-w-3xl mx-auto px-3 sm:px-4">
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
