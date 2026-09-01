"use client";

import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Brain, RefreshCw, AlertCircle } from "lucide-react";
import { CodeBlock } from "@/components/chat/CodeBlock";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChat";

const markdownComponents = {
  pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
    const match = /language-(\w+)/.exec(className ?? "");
    if (match) {
      return <CodeBlock language={match[1]} code={String(children).replace(/\n$/, "")} />;
    }
    return <code className="chat-inline-code">{children}</code>;
  },
};

interface Props {
  message: ChatMessageType;
  onRetry?: () => void;
}

export const ChatMessage = memo(function ChatMessage({ message, onRetry }: Props) {
  const isUser = message.role === "user";
  const isStreaming = message.isStreaming === true;
  const content = message.content;
  const hasMemories = !isUser && message.memoryIds && message.memoryIds.length > 0;
  const memoryCount = message.memoryIds?.length ?? 0;
  const isError = !isUser && message.isError === true;

  return (
    <div className={cn("flex gap-3 mb-5", isUser ? "justify-end" : "justify-start")}>
      {/* Assistant avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shrink-0 mt-0.5">
          <Brain className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      {/* Message */}
      <div className={cn("max-w-[80%] flex flex-col", isUser ? "items-end" : "items-start")}>
        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed",
            isUser
              ? "chat-bubble-user rounded-br-md"
              : isError
              ? "chat-bubble-error rounded-bl-md"
              : "chat-bubble-assistant rounded-bl-md"
          )}
        >
          {isUser ? (
            <>
              {message.images && message.images.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {message.images.map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={`data:${img.mediaType};base64,${img.data}`} alt="Attached" className="w-20 h-20 rounded-xl object-cover" />
                  ))}
                </div>
              )}
              {content && <p className="whitespace-pre-wrap">{content}</p>}
            </>
          ) : (
            <div className="prose-conch">
              {isStreaming ? (
                <p className="whitespace-pre-wrap">
                  {content}
                  <span className="chat-cursor inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse rounded-full" />
                </p>
              ) : content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
              ) : null}
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 px-1 mt-1">
          <span className="text-[11px] chat-text-muted">{formatRelativeTime(message.createdAt)}</span>

          {isError && onRetry && (
            <button onClick={onRetry} className="flex items-center gap-1 text-[11px] text-destructive hover:text-destructive/80 transition-colors">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          )}

          {isError && !onRetry && (
            <span className="flex items-center gap-1 text-[11px] text-destructive">
              <AlertCircle className="w-3 h-3" /> Error
            </span>
          )}

          {hasMemories && (
            <span className="flex items-center gap-1 text-[11px] chat-text-muted">
              <Brain className="w-3 h-3 text-primary" />
              {memoryCount}
            </span>
          )}
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[11px] font-semibold text-primary">U</span>
        </div>
      )}
    </div>
  );
});
