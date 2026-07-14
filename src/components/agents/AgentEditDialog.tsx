"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAgent } from "@/hooks/useAgent";
import type { AgentDoc, AppwriteDoc } from "@/lib/db";
type Agent = AppwriteDoc<AgentDoc>;

const MODELS = ["claude-opus-4-8", "claude-sonnet-5", "claude-haiku-4-5-20251001"];

interface Props { agent: Agent | null; onClose: () => void; }

export function AgentEditDialog({ agent, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [modelId, setModelId] = useState("claude-haiku-4-5-20251001");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const { update } = useAgent();

  useEffect(() => {
    if (agent) {
      setName(agent.name); setDescription(agent.description ?? "");
      setSystemPrompt(agent.systemPrompt); setModelId(agent.modelId ?? "claude-haiku-4-5-20251001");
      setTemperature(agent.temperature); setMaxTokens(agent.maxTokens);
    }
  }, [agent]);

  const handleSubmit = async () => {
    if (!agent || !name.trim() || !systemPrompt.trim()) return;
    try {
      await update.mutateAsync({ id: agent.$id, data: { name, description, systemPrompt, modelId, temperature, maxTokens } });
      onClose();
    } catch {
      // Error toast already shown by the mutation's onError handler
    }
  };

  return (
    <Dialog open={!!agent} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="glass border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-white">Edit Agent</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-slate-300 mb-1.5 block">Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 border-white/10 text-white" />
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="bg-white/5 border-white/10 text-white" />
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">System Prompt * ({systemPrompt.length}/4000)</Label>
            <Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value.slice(0, 4000))} rows={5}
              className="bg-white/5 border-white/10 text-white resize-none font-mono text-xs" />
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">Model</Label>
            <Select value={modelId} onValueChange={setModelId}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>{MODELS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">Temperature: {temperature.toFixed(1)}</Label>
            <Slider value={[temperature]} onValueChange={([v]) => setTemperature(v)} min={0} max={2} step={0.1} />
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">Max Tokens: {maxTokens}</Label>
            <Slider value={[maxTokens]} onValueChange={([v]) => setMaxTokens(v)} min={100} max={4000} step={100} />
          </div>
        </div>
        <div className="flex gap-3 mt-4 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !systemPrompt.trim() || update.isPending}>
            {update.isPending && <LoadingSpinner size="sm" />}
            {update.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
