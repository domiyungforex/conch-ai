"use client";

import { memo } from "react";
import { Brain, Settings, Star, Zap } from "lucide-react";

interface Props {
  onSelect: (prompt: string) => void;
}

const prompts = [
  { icon: Brain,    text: "What do you remember about me?", color: "text-coral-400", bg: "bg-coral-500/10" },
  { icon: Settings, text: "Set a new preference",           color: "text-teal-400",   bg: "bg-teal-500/10" },
  { icon: Star,     text: "Show my recent memories",        color: "text-gold-400",   bg: "bg-gold-500/10" },
  { icon: Zap,      text: "Create a new goal",              color: "text-coral-400",  bg: "bg-coral-500/10" },
];

export const SuggestedPrompts = memo(function SuggestedPrompts({ onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
      {prompts.map(({ icon: Icon, text, color, bg }) => (
        <button
          key={text}
          type="button"
          onClick={() => onSelect(text)}
          className="w-full text-left glass-card p-3.5 group transition-all duration-300 hover:bg-card-hover hover:shadow-lg"
        >
          <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <p className="text-[13px] chat-text-muted group-hover:text-foreground transition-colors leading-snug">
            {text}
          </p>
        </button>
      ))}
    </div>
  );
});
