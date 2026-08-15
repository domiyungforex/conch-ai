"use client";

import { useState, type FormEvent } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AssistantPanelProps {
  askPath: string; // e.g. /api/business/{id}/ask
  placeholder?: string;
  hint?: string;
}

interface AskResult {
  answer: string;
  provider: string;
}

export function AssistantPanel({ askPath, placeholder, hint }: AssistantPanelProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAsk(e: FormEvent) {
    e.preventDefault();
    if (loading || !question.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch(askPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      const data: AskResult = await res.json();
      setAnswer(data.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAsk} className="flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={placeholder ?? "Ask about this workspace…"}
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !question.trim()} className="shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Asking…" : "Ask"}
        </Button>
      </form>

      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">{error}</p>}

      {answer && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 whitespace-pre-wrap text-sm text-slate-200 leading-relaxed">
          {answer}
        </div>
      )}

      {!answer && !error && !loading && hint && (
        <p className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}
