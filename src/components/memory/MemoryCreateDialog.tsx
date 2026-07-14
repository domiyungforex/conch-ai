"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useMemory } from "@/hooks/useMemory";
import type { MemoryCategory } from "@/lib/db";

interface Props {
  open: boolean;
  onClose: () => void;
}

const categories: { value: MemoryCategory; label: string }[] = [
  { value: "SEMANTIC", label: "Semantic" },
  { value: "EPISODIC", label: "Episodic" },
  { value: "PREFERENCE", label: "Preference" },
  { value: "PROCEDURAL", label: "Procedural" },
];

export function MemoryCreateDialog({ open, onClose }: Props) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<MemoryCategory>("SEMANTIC");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [importance, setImportance] = useState(0.5);
  const { create } = useMemory();

  const addTag = (raw: string) => {
    const newTags = raw.split(/[,\s]+/).map((t) => t.trim().toLowerCase()).filter(Boolean);
    setTags((prev) => [...new Set([...prev, ...newTags])]);
    setTagInput("");
  };

  const reset = () => { setContent(""); setCategory("SEMANTIC"); setTags([]); setTagInput(""); setImportance(0.5); };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    try {
      await create.mutateAsync({ content, category, tags, importance });
      reset();
      onClose();
    } catch {
      // Error toast already shown by the mutation's onError handler
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="glass border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Add Memory</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-slate-300 mb-1.5 block">Content *</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What should Conch remember about you?"
              rows={4}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none"
              maxLength={5000}
            />
            <p className="text-xs text-slate-600 mt-1 text-right">{content.length}/5000</p>
          </div>

          <div>
            <Label className="text-slate-300 mb-1.5 block">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as MemoryCategory)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300 mb-1.5 block">Tags</Label>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }}
              onBlur={() => tagInput && addTag(tagInput)}
              placeholder="Add tags (press Enter or comma)"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-xs text-violet-300">
                    {t}
                    <button onClick={() => setTags((prev) => prev.filter((x) => x !== t))} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="text-slate-300 mb-1.5 block">Importance: {Math.round(importance * 100)}%</Label>
            <Slider
              value={[importance]}
              onValueChange={([v]) => setImportance(v)}
              min={0} max={1} step={0.05}
              className="mt-2"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4 justify-end">
          <Button variant="secondary" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!content.trim() || create.isPending}>
            {create.isPending && <LoadingSpinner size="sm" />}
            {create.isPending ? "Saving…" : "Save Memory"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
