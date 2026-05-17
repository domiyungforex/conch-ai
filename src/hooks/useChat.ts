"use client";

import { useState, useRef, useCallback } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  memoryIds?: string[];
  createdAt: Date;
  isError?: boolean;
}

const GENERIC_AI_ERROR = "An error occurred.";

interface UseChatOptions {
  conversationId?: string | null;
  agentId?: string | null;
  onConversationCreated?: (id: string) => void;
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.clone().json();
    if (typeof data?.error === "string") return data.error;
  } catch {
    // not JSON
  }
  switch (res.status) {
    case 401: return "You need to sign in to continue.";
    case 429: return "Too many messages. Please wait a moment before trying again.";
    case 503: return "AI service is temporarily unavailable. Please try again shortly.";
    default:  return "Something went wrong. Please try again.";
  }
}

export function useChat({ conversationId, agentId, onConversationCreated }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const lastUserMsgRef = useRef<string>("");

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    lastUserMsgRef.current = content;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content, createdAt: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, agentId, message: content }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errorText = await extractErrorMessage(res);
        throw new Error(errorText);
      }

      // Capture conversation ID but don't navigate yet — wait until stream finishes.
      const newConvId = res.headers.get("X-Conversation-Id");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (!reader) throw new Error("No response from AI. Please try again.");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("0:")) {
            // Text delta chunk
            try {
              const text = JSON.parse(line.slice(2));
              if (typeof text === "string") {
                accumulated += text;
                setStreamingContent(accumulated);
              }
            } catch {
              // skip malformed chunk
            }
          } else if (line.startsWith("3:")) {
            // Error chunk from AI SDK — map the SDK's generic message to something actionable
            try {
              const errText = JSON.parse(line.slice(2));
              const isGeneric = typeof errText !== "string" || errText === GENERIC_AI_ERROR || errText.trim() === "";
              const msg = isGeneric
                ? "AI service temporarily unavailable. Please try again."
                : errText;
              throw new Error(msg);
            } catch (e) {
              if (e instanceof Error) throw e;
              throw new Error("AI service temporarily unavailable. Please try again.");
            }
          }
        }
      }

      // If we got an empty response, show a safe fallback instead of blank bubble.
      if (!accumulated.trim()) {
        accumulated = "I wasn't able to generate a response. Please try again.";
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: accumulated,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Navigate only AFTER the stream is fully consumed so the assistant
      // message is already persisted to DB before the new page fetches it.
      if (newConvId && !conversationId && onConversationCreated) {
        onConversationCreated(newConvId);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: (err as Error).message || "Something went wrong. Please try again.",
          createdAt: new Date(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setIsLoading(false);
      setStreamingContent("");
      abortRef.current = null;
    }
  }, [conversationId, agentId, isLoading, onConversationCreated]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const loadMessages = useCallback((msgs: ChatMessage[]) => {
    setMessages(msgs);
  }, []);

  const retryLast = useCallback(() => {
    if (!lastUserMsgRef.current || isLoading) return;
    // Remove the error message; also remove the user message so sendMessage can re-add it cleanly
    setMessages((prev) => {
      const withoutError = prev[prev.length - 1]?.isError ? prev.slice(0, -1) : prev;
      return withoutError[withoutError.length - 1]?.role === "user"
        ? withoutError.slice(0, -1)
        : withoutError;
    });
    sendMessage(lastUserMsgRef.current);
  }, [isLoading, sendMessage]);

  return { messages, input, setInput, isLoading, streamingContent, sendMessage, stop, loadMessages, retryLast };
}
