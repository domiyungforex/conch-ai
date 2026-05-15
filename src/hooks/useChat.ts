"use client";

import { useState, useRef, useCallback } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  memoryIds?: string[];
  createdAt: Date;
}

interface UseChatOptions {
  conversationId?: string | null;
  agentId?: string | null;
  onConversationCreated?: (id: string) => void;
}

export function useChat({ conversationId, agentId, onConversationCreated }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

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

      if (!res.ok) throw new Error("Chat request failed");

      const newConvId = res.headers.get("X-Conversation-Id");
      if (newConvId && !conversationId && onConversationCreated) {
        onConversationCreated(newConvId);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const text = JSON.parse(line.slice(2));
              accumulated += text;
              setStreamingContent(accumulated);
            } catch {
              // Skip malformed chunks
            }
          }
        }
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: accumulated,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          createdAt: new Date(),
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

  return { messages, input, setInput, isLoading, streamingContent, sendMessage, stop, loadMessages };
}
