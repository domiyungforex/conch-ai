'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, Heart, Home, DollarSign, Compass, Briefcase, HeartHandshake, Crown, RefreshCw, Users, AlertTriangle, GitBranch, CloudRain, Flame, Cross, HelpCircle, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

const categories = [
  { value: 'fear', label: 'Fear', icon: Shield },
  { value: 'relationships', label: 'Relationships', icon: Heart },
  { value: 'family', label: 'Family', icon: Home },
  { value: 'money', label: 'Money', icon: DollarSign },
  { value: 'purpose', label: 'Purpose', icon: Compass },
  { value: 'career', label: 'Career', icon: Briefcase },
  { value: 'forgiveness', label: 'Forgiveness', icon: HeartHandshake },
  { value: 'leadership', label: 'Leadership', icon: Crown },
  { value: 'failure', label: 'Failure', icon: RefreshCw },
  { value: 'loneliness', label: 'Loneliness', icon: Users },
  { value: 'temptation', label: 'Temptation', icon: AlertTriangle },
  { value: 'decision_making', label: 'Decision-making', icon: GitBranch },
  { value: 'grief', label: 'Grief', icon: CloudRain },
  { value: 'anger', label: 'Anger', icon: Flame },
  { value: 'faith', label: 'Faith', icon: Cross },
  { value: 'doubt', label: 'Doubt', icon: HelpCircle },
];

function LifeContent() {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category');
  const [question, setQuestion] = useState('');
  const category = categories.find((c) => c.value === selectedCategory);

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-stone-900">Life</h1>
          <p className="text-stone-500 mt-1">Apply biblical principles to real life</p>
        </div>
        <p className="text-sm text-stone-600 mb-6">What are you facing? Select a category.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.value} href={`/life?category=${cat.value}`}>
                <Card className="bg-white border-stone-200 hover:border-stone-300 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Icon className="h-5 w-5 text-stone-500 shrink-0" />
                    <span className="text-sm text-stone-700">{cat.label}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  const Icon = category.icon;
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center">
          <Icon className="h-5 w-5 text-stone-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">{category.label}</h1>
          <p className="text-stone-500 text-sm">Biblical guidance for {category.label.toLowerCase()}</p>
        </div>
      </div>
      <Card className="bg-white border-stone-200 mb-8">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-stone-700 mb-3">Describe your situation</p>
          <Textarea placeholder={`What are you facing related to ${category.label.toLowerCase()}?`} value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} className="mb-4" />
          <div className="flex justify-end">
            <Button disabled={!question.trim()}><BookOpen className="h-4 w-4 mr-2" />Get Biblical Guidance</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LifePage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-6 w-6 animate-spin text-stone-400" /></div>}>
      <LifeContent />
    </Suspense>
  );
}
