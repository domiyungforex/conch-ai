'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save, Download, Plus, Trash2 } from 'lucide-react';

interface SermonSection { type: string; title: string; content: string; }
interface Sermon { title: string; mainText: string; bigIdea: string; sections: SermonSection[]; metadata?: Record<string, string>; }

const sectionIcons: Record<string, string> = {
  introduction: '📖', context: '🔍', point_1: '1️⃣', point_2: '2️⃣', point_3: '3️⃣',
  illustration: '💡', application: '🎯', conclusion: '🏁', prayer: '🙏', discussion: '💬',
};

export default function SermonEditorPage() {
  const router = useRouter();
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [editing, setEditing] = useState<number | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('generated-sermon');
    if (stored) setSermon(JSON.parse(stored));
    else router.push('/teach/sermon');
  }, [router]);

  const updateSection = (i: number, field: keyof SermonSection, value: string) => {
    if (!sermon) return;
    const s = [...sermon.sections]; s[i] = { ...s[i], [field]: value };
    setSermon({ ...sermon, sections: s });
  };

  const addSection = () => {
    if (!sermon) return;
    setSermon({ ...sermon, sections: [...sermon.sections, { type: 'custom', title: 'New Section', content: '' }] });
  };

  const removeSection = (i: number) => {
    if (!sermon) return;
    setSermon({ ...sermon, sections: sermon.sections.filter((_, idx) => idx !== i) });
  };

  const moveSection = (i: number, dir: 'up' | 'down') => {
    if (!sermon) return;
    const s = [...sermon.sections];
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= s.length) return;
    [s[i], s[j]] = [s[j], s[i]];
    setSermon({ ...sermon, sections: s });
  };

  const exportMarkdown = () => {
    if (!sermon) return;
    let md = `# ${sermon.title}\n\n`;
    if (sermon.mainText) md += `**Main Text:** ${sermon.mainText}\n\n`;
    if (sermon.bigIdea) md += `**Big Idea:** ${sermon.bigIdea}\n\n---\n\n`;
    for (const s of sermon.sections) md += `## ${s.title}\n\n${s.content}\n\n`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${sermon.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`; a.click();
  };

  if (!sermon) return <div className="max-w-3xl mx-auto px-4 py-12 text-center text-stone-500">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-8">
        <button onClick={() => router.push('/teach/sermon')} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Builder
        </button>
        <h1 className="text-2xl font-semibold text-stone-900">Sermon Editor</h1>
        <p className="text-stone-500 mt-1">Review and edit your sermon</p>
      </div>

      <Card className="bg-white border-stone-200 mb-6">
        <CardContent className="p-6 space-y-4">
          <div><label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Title</label>
            <Input value={sermon.title} onChange={(e) => setSermon({ ...sermon, title: e.target.value })} className="text-xl font-semibold mt-1" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Main Text</label>
              <Input value={sermon.mainText} onChange={(e) => setSermon({ ...sermon, mainText: e.target.value })} className="mt-1" /></div>
            <div><label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Big Idea</label>
              <Input value={sermon.bigIdea} onChange={(e) => setSermon({ ...sermon, bigIdea: e.target.value })} className="mt-1" /></div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 mb-6">
        {sermon.sections.map((section, i) => (
          <Card key={i} className="bg-white border-stone-200">
            <CardContent className="p-0">
              <div className="flex items-center gap-2 p-4 border-b border-stone-100">
                <span className="text-lg">{sectionIcons[section.type] || '📄'}</span>
                <input value={section.title} onChange={(e) => updateSection(i, 'title', e.target.value)}
                  className="flex-1 font-medium text-stone-900 bg-transparent border-none focus:outline-none" />
                <div className="flex items-center gap-1">
                  <button onClick={() => moveSection(i, 'up')} disabled={i === 0} className="p-1 text-stone-400 hover:text-stone-600 disabled:opacity-30">↑</button>
                  <button onClick={() => moveSection(i, 'down')} disabled={i === sermon.sections.length - 1} className="p-1 text-stone-400 hover:text-stone-600 disabled:opacity-30">↓</button>
                  <button onClick={() => setEditing(editing === i ? null : i)} className="p-1 text-stone-400 hover:text-stone-600">{editing === i ? '✓' : '✎'}</button>
                  <button onClick={() => removeSection(i)} className="p-1 text-stone-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="p-4">
                {editing === i ? (
                  <Textarea value={section.content} onChange={(e) => updateSection(i, 'content', e.target.value)} rows={10} className="font-serif text-stone-800 leading-relaxed" />
                ) : (
                  <div className="font-serif text-stone-800 leading-relaxed whitespace-pre-wrap">
                    {section.content || <span className="text-stone-400 italic">Click edit to add content...</span>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 mb-8">
        <Button variant="outline" onClick={addSection} className="flex-1"><Plus className="h-4 w-4 mr-2" /> Add Section</Button>
        <Button variant="outline" onClick={exportMarkdown}><Download className="h-4 w-4 mr-2" /> Export</Button>
        <Button onClick={() => { sessionStorage.setItem('generated-sermon', JSON.stringify(sermon)); alert('Saved!'); }}><Save className="h-4 w-4 mr-2" /> Save</Button>
      </div>
    </div>
  );
}
