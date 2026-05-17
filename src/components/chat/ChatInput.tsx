"use client";

import { useRef, KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (message: string) => void;
  onStop?: () => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const MAX_CHARS = 10000;

export function ChatInput({ value, onChange, onSubmit, onStop, isLoading, placeholder = "Message Conch...", disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSubmit(value.trim());
      }
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const nearLimit = value.length > MAX_CHARS * 0.8;

  return (
    <div className="glass border border-white/10 rounded-2xl p-3 focus-within:border-violet-500/50 transition-colors">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value.slice(0, MAX_CHARS));
          handleInput();
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        rows={1}
        className={cn(
          "w-full bg-transparent text-white placeholder:text-slate-500 resize-none outline-none text-sm leading-relaxed min-h-[24px] max-h-40",
          (disabled || isLoading) && "opacity-50 cursor-not-allowed"
        )}
      />

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
        {nearLimit ? (
          <span className={cn("text-xs", value.length >= MAX_CHARS ? "text-red-400" : "text-amber-400")}>
            {value.length}/{MAX_CHARS}
          </span>
        ) : (
          <span className="text-xs text-slate-600">Shift+Enter for newline</span>
        )}

        {isLoading ? (
          <Button variant="secondary" size="sm" onClick={onStop} className="h-8 px-3 text-xs">
            <Square className="w-3.5 h-3.5" /> Stop
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => { if (value.trim()) onSubmit(value.trim()); }}
            disabled={!value.trim() || disabled}
            className="h-8 px-3 text-xs"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </Button>
        )}
      </div>
    </div>
  );
}
