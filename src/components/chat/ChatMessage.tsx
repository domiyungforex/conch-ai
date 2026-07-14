"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Brain, RefreshCw, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChat";

interface Props {
  message: ChatMessageType;
  isStreaming?: boolean;
  streamingContent?: string;
  onRetry?: () => void;
}

export function ChatMessage({ message, isStreaming, streamingContent, onRetry }: Props) {
  const isUser = message.role === "user";
  const content = isStreaming ? streamingContent ?? "" : message.content;
  const hasMemories = !isUser && message.memoryIds && message.memoryIds.length > 0;
  const memoryCount = message.memoryIds?.length ?? 0;
  const isError = !isUser && message.isError === true;

  return (
    <div className={cn("flex gap-3 max-w-3xl", isUser ? "ml-auto flex-row-reverse" : "mr-auto")}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-linear-to-br from-coral-600 to-gold-600 flex items-center justify-center shrink-0 mt-1">
          <Brain className="w-4 h-4 text-white" />
        </div>
      )}
      {isUser && (
        <Avatar className="w-8 h-8 shrink-0 mt-1">
          <AvatarFallback className="bg-white/10 text-white text-xs font-semibold">U</AvatarFallback>
        </Avatar>
      )}

      {/* Bubble */}
      <div className={cn("max-w-[80%] space-y-1", isUser ? "items-end" : "items-start", "flex flex-col")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-coral-600/30 border border-coral-500/30 text-white rounded-tr-sm"
              : isError
              ? "glass border border-red-500/30 text-slate-300 rounded-tl-sm border-l-2 border-l-red-500/50"
              : "glass border border-white/8 text-slate-100 rounded-tl-sm border-l-2 border-l-coral-500/50"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="prose-conch">
              {isStreaming ? (
                <motion.p
                  key="streaming"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-pre-wrap"
                >
                  {content}
                  <span className="inline-block w-0.5 h-4 bg-coral-400 ml-0.5 align-middle animate-pulse" />
                </motion.p>
              ) : content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-slate-600">{formatRelativeTime(message.createdAt)}</span>

          {isError && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </Button>
          )}

          {isError && !onRetry && (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <AlertCircle className="w-3 h-3" />
              Error
            </span>
          )}

          {hasMemories && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="flex items-center gap-1.5 text-xs text-coral-500"
            >
              <motion.div
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1.2, repeat: 3, ease: "easeInOut" }}
                className="w-1.5 h-1.5 rounded-full bg-coral-400"
              />
              <Brain className="w-3 h-3" />
              <span>{memoryCount} {memoryCount === 1 ? "memory" : "memories"} recalled</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
