"use client";

import { useState, useRef, useCallback } from "react";

export interface ChatImage {
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
  data: string; // base64, no data: URL prefix
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  memoryIds?: string[];
  createdAt: Date;
  isError?: boolean;
  isStreaming?: boolean;
  images?: ChatImage[];
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
  const lastUserMsgRef = useRef<{ content: string; images?: ChatImage[] }>({ content: "" });

  const sendMessage = useCallback(async (content: string, images?: ChatImage[]) => {
    if ((!content.trim() && !images?.length) || isLoading) return;

    lastUserMsgRef.current = { content, images };

    // Add user message
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content, createdAt: new Date(), images };

    // Add streaming placeholder immediately with a stable ID
    const streamId = crypto.randomUUID();
    const streamMsg: ChatMessage = { id: streamId, role: "assistant", content: "", createdAt: new Date(), isStreaming: true };

    setMessages((prev) => [...prev, userMsg, streamMsg]);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, agentId, message: content, images }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errorText = await extractErrorMessage(res);
        throw new Error(errorText);
      }

      const newConvId = res.headers.get("X-Conversation-Id");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (!reader) throw new Error("No response from AI. Please try again.");

      let lineBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const text = JSON.parse(line.slice(2));
              if (typeof text === "string") {
                accumulated += text;
                // Update the streaming message in-place (stable ID, no unmount)
                setMessages((prev) =>
                  prev.map((m) => m.id === streamId ? { ...m, content: accumulated } : m)
                );
              }
            } catch {
              // skip malformed chunk
            }
          } else if (line.startsWith("3:")) {
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

      // Flush remaining buffer
      if (lineBuffer.startsWith("0:")) {
        try {
          const text = JSON.parse(lineBuffer.slice(2));
          if (typeof text === "string") accumulated += text;
        } catch {
          // incomplete trailing line — discard
        }
      }

      if (!accumulated.trim()) {
        accumulated = "I wasn't able to generate a response. Please try again.";
      }

      // Finalize the message in-place — mark streaming complete
      setMessages((prev) =>
        prev.map((m) => m.id === streamId ? { ...m, content: accumulated, isStreaming: false } : m)
      );

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
        // Remove the streaming placeholder and add the error
        setMessages((prev) => [...prev.filter((m) => m.id !== streamId), errorMsg]);
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
    if (!lastUserMsgRef.current.content && !lastUserMsgRef.current.images?.length) return;
    if (isLoading) return;
    setMessages((prev) => {
      const withoutError = prev[prev.length - 1]?.isError ? prev.slice(0, -1) : prev;
      return withoutError[withoutError.length - 1]?.role === "user"
        ? withoutError.slice(0, -1)
        : withoutError;
    });
    sendMessage(lastUserMsgRef.current.content, lastUserMsgRef.current.images);
  }, [isLoading, sendMessage]);

  return { messages, input, setInput, isLoading, streamingContent, sendMessage, stop, loadMessages, retryLast };
}
