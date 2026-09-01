'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Sparkles } from 'lucide-react';

const sermonTypes = [
  { value: 'expository', label: 'Expository' },
  { value: 'topical', label: 'Topical' },
  { value: 'textual', label: 'Textual' },
  { value: 'evangelistic', label: 'Evangelistic' },
  { value: 'teaching', label: 'Teaching' },
  { value: 'devotional', label: 'Devotional' },
  { value: 'youth', label: 'Youth' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'funeral', label: 'Funeral' },
];

const durations = [
  { value: '10', label: '10 minutes' },
  { value: '20', label: '20 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '60 minutes' },
];

export default function SermonBuilderPage() {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    topic: '',
    passage: '',
    audience: 'General congregation',
    duration: '30',
    type: 'expository',
    style: '',
    purpose: '',
    notes: '',
  });

  const handleGenerate = async () => {
    if (!form.topic.trim() && !form.passage.trim()) return;
    setGenerating(true);

    try {
      const res = await fetch('/api/sermon/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Failed to generate');

      const data = await res.json();
      // Store the generated sermon and redirect to editor
      sessionStorage.setItem('generated-sermon', JSON.stringify(data));
      router.push('/teach/sermon/edit');
    } catch (err) {
      console.error('Generation failed:', err);
      alert('Failed to generate sermon. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-8">
        <button onClick={() => router.push('/teach')} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Teach
        </button>
        <h1 className="text-2xl font-semibold text-stone-900">Sermon Builder</h1>
        <p className="text-stone-500 mt-1">Create a sermon with AI assistance</p>
      </div>

      <div className="space-y-6">
        <Card className="bg-white border-stone-200">
          <CardHeader><CardTitle className="text-lg">Sermon Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-stone-700 mb-1 block">Topic *</label>
              <Input placeholder="e.g., Faith, Forgiveness, Hope, The Good Shepherd" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700 mb-1 block">Main Passage</label>
              <Input placeholder="e.g., Romans 8:28-39, Psalm 23, John 3:16-21" value={form.passage} onChange={(e) => setForm({ ...form, passage: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1 block">Sermon Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900">
                  {sermonTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1 block">Duration</label>
                <select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900">
                  {durations.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700 mb-1 block">Audience</label>
              <Input placeholder="e.g., General congregation, Youth group, Small group" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700 mb-1 block">Style & Tone</label>
              <Input placeholder="e.g., Conversational, Academic, Passionate, Gentle" value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700 mb-1 block">Purpose</label>
              <Input placeholder="e.g., Encourage, Challenge, Teach, Comfort" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700 mb-1 block">Additional Notes</label>
              <Textarea placeholder="Any specific themes, illustrations, or points to include..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleGenerate} disabled={generating || (!form.topic.trim() && !form.passage.trim())} className="w-full" size="lg">
          {generating ? (
            <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Generating sermon...</>
          ) : (
            <><Sparkles className="h-5 w-5 mr-2" /> Generate Sermon</>
          )}
        </Button>
      </div>
    </div>
  );
}
