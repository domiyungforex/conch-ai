"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAgent } from "@/hooks/useAgent";

const MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"];

interface Props { open: boolean; onClose: () => void; }

export function AgentCreateDialog({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [modelId, setModelId] = useState("gpt-4o");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const { create } = useAgent();

  const reset = () => { setName(""); setDescription(""); setSystemPrompt(""); setModelId("gpt-4o"); setTemperature(0.7); setMaxTokens(2000); };

  const handleSubmit = async () => {
    if (!name.trim() || !systemPrompt.trim()) return;
    await create.mutateAsync({ name, description, systemPrompt, modelId, temperature, maxTokens });
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="glass border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Create Agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-slate-300 mb-1.5 block">Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Custom Agent"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this agent do?"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">System Prompt * ({systemPrompt.length}/4000)</Label>
            <Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value.slice(0, 4000))}
              placeholder="You are a helpful assistant specialized in…" rows={5}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none font-mono text-xs" />
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
            <div className="flex justify-between text-xs text-slate-600 mt-1"><span>Precise</span><span>Creative</span></div>
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">Max Tokens: {maxTokens}</Label>
            <Slider value={[maxTokens]} onValueChange={([v]) => setMaxTokens(v)} min={100} max={4000} step={100} />
          </div>
        </div>
        <div className="flex gap-3 mt-4 justify-end">
          <Button variant="secondary" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !systemPrompt.trim() || create.isPending}>
            {create.isPending ? "Creating…" : "Create Agent"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
