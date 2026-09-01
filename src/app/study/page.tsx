'use client';

import { useState } from 'react';
import { Plus, Clock, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const recentStudies = [
  { id: '1', title: 'Faith in Uncertainty', lastAccessed: '2 hours ago', messageCount: 12 },
  { id: '2', title: 'Understanding Romans 8', lastAccessed: 'Yesterday', messageCount: 8 },
  { id: '3', title: 'The Character of David', lastAccessed: '3 days ago', messageCount: 15 },
];

export default function StudyPage() {
  const [newStudyTopic, setNewStudyTopic] = useState('');
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Study</h1>
          <p className="text-stone-500 mt-1">Deep dive into Scripture with guided study</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />New Study</Button>
      </div>
      <Card className="mb-8 bg-white border-stone-200">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-stone-700 mb-3">Start a new study</p>
          <div className="flex gap-3">
            <Input placeholder="What would you like to study?" value={newStudyTopic} onChange={(e) => setNewStudyTopic(e.target.value)} className="flex-1" />
            <Button disabled={!newStudyTopic.trim()}><GraduationCap className="h-4 w-4 mr-2" />Begin</Button>
          </div>
        </CardContent>
      </Card>
      <h2 className="text-lg font-semibold text-stone-900 mb-4">Recent Studies</h2>
      <div className="space-y-3">
        {recentStudies.map((study) => (
          <Card key={study.id} className="bg-white border-stone-200 hover:border-stone-300 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-stone-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-900">{study.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-stone-500 flex items-center gap-1"><Clock className="h-3 w-3" />{study.lastAccessed}</span>
                  <span className="text-xs text-stone-500">{study.messageCount} messages</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-400" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
