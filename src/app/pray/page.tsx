'use client';

import { useState } from 'react';
import { Compass, Sun, Moon, BookOpen, Heart, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

const prayerTypes = [
  { value: 'morning', label: 'Morning Prayer', description: 'Start your day with Scripture', icon: Sun },
  { value: 'evening', label: 'Evening Prayer', description: 'Reflect and surrender', icon: Moon },
  { value: 'scripture', label: 'Scripture Prayer', description: "Pray God's Word back to Him", icon: BookOpen },
  { value: 'topic', label: 'Prayer for a Topic', description: 'Pray about a specific situation', icon: Heart },
  { value: 'prompts', label: 'Prayer Prompts', description: 'Guided reflection questions', icon: Lightbulb },
];

export default function PrayPage() {
  const [topic, setTopic] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Pray</h1>
        <p className="text-stone-500 mt-1">Scripture-grounded prayers for every situation</p>
      </div>
      <div className="mb-8">
        <h2 className="text-sm font-medium text-stone-700 mb-3">How would you like to pray?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {prayerTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.value;
            return (
              <button key={type.value} onClick={() => setSelectedType(type.value)}
                className={`text-left p-4 rounded-xl border transition-colors ${isSelected ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-300 bg-white'}`}>
                <Icon className={`h-5 w-5 mb-2 ${isSelected ? 'text-stone-900' : 'text-stone-400'}`} />
                <p className="text-sm font-medium text-stone-900">{type.label}</p>
                <p className="text-xs text-stone-500 mt-0.5">{type.description}</p>
              </button>
            );
          })}
        </div>
      </div>
      <Card className="bg-white border-stone-200 mb-8">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-stone-700 mb-3">What would you like to pray about?</p>
          <Textarea placeholder="e.g., 'Help me pray about my future', 'Give me a prayer for forgiveness'" value={topic} onChange={(e) => setTopic(e.target.value)} rows={3} className="mb-4" />
          <div className="flex justify-end">
            <Button disabled={!topic.trim()}><Compass className="h-4 w-4 mr-2" />Create Prayer</Button>
          </div>
        </CardContent>
      </Card>
      <div className="text-center py-12 text-stone-400">
        <Compass className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">Your Scripture-grounded prayer will appear here.</p>
      </div>
    </div>
  );
}
