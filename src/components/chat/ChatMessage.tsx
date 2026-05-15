"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Brain } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChat";

interface Props {
  message: ChatMessageType;
  isStreaming?: boolean;
  streamingContent?: string;
}

export function ChatMessage({ message, isStreaming, streamingContent }: Props) {
  const isUser = message.role === "user";
  const content = isStreaming ? streamingContent ?? "" : message.content;

  return (
    <div className={cn("flex gap-3 max-w-3xl", isUser ? "ml-auto flex-row-reverse" : "mr-auto")}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
          <Brain className="w-4 h-4 text-white" />
        </div>
      )}
      {isUser && (
        <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
          <AvatarFallback className="bg-white/10 text-white text-xs font-semibold">U</AvatarFallback>
        </Avatar>
      )}

      {/* Bubble */}
      <div className={cn("max-w-[80%] space-y-1", isUser ? "items-end" : "items-start", "flex flex-col")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-violet-600/30 border border-violet-500/30 text-white rounded-tr-sm"
              : "glass border border-white/8 text-slate-100 rounded-tl-sm border-l-2 border-l-violet-500/50"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="prose-conch">
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              ) : isStreaming ? null : null}
              {isStreaming && (
                <span
                  className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 align-middle"
                  style={{ animation: "typewriter-blink 1s infinite" }}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-slate-600">{formatRelativeTime(message.createdAt)}</span>
          {!isUser && message.memoryIds && message.memoryIds.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-violet-500">
              <Brain className="w-3 h-3" />
              {message.memoryIds.length} memories used
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
