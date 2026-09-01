'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Shield, Heart, Home as HomeIcon, DollarSign, Compass, Briefcase, HeartHandshake, Crown, RefreshCw, Users, AlertTriangle, GitBranch, CloudRain, Flame, Cross, HelpCircle, BookOpen, MessageCircle, GraduationCap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const lifeCategories = [
  { value: 'fear', label: 'Fear', icon: Shield },
  { value: 'relationships', label: 'Relationships', icon: Heart },
  { value: 'family', label: 'Family', icon: HomeIcon },
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

const examplePrompts = [
  'What does Romans 8 mean?',
  'Create a sermon about forgiveness.',
  "What does Scripture say about fear?",
  'Help me study Esther.',
];

export default function HomePage() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/ask?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-stone-900 mb-4">THE WAY</h1>
        <p className="text-xl md:text-2xl text-stone-600 font-light mb-8">Understand Scripture.<br />Live it out.</p>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
            <Input type="text" placeholder="Ask anything about Scripture, faith, or life..." value={query} onChange={(e) => setQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg bg-white border-stone-200 rounded-xl shadow-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent" />
            <Button type="submit" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg">Ask</Button>
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-2">
          {examplePrompts.map((prompt) => (
            <button key={prompt} onClick={() => router.push(`/ask?q=${encodeURIComponent(prompt)}`)}
              className="text-sm text-stone-500 hover:text-stone-700 px-3 py-1.5 rounded-full border border-stone-200 hover:border-stone-300 transition-colors">
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Today */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Today</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white border-stone-200"><CardContent className="p-6">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Today&apos;s Scripture</p>
            <p className="font-serif text-lg text-stone-800 mb-2">&ldquo;Trust in the LORD with all your heart and lean not on your own understanding.&rdquo;</p>
            <p className="text-sm text-stone-500">Proverbs 3:5</p>
          </CardContent></Card>
          <Card className="bg-white border-stone-200"><CardContent className="p-6">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Today&apos;s Reflection</p>
            <p className="text-stone-700">What area of your life are you trying to control instead of trusting God with?</p>
          </CardContent></Card>
          <Card className="bg-white border-stone-200"><CardContent className="p-6">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Today&apos;s Prayer</p>
            <p className="text-stone-700">Lord, help me to trust You more deeply today. When anxiety rises, remind me of Your faithfulness.</p>
          </CardContent></Card>
          <Card className="bg-white border-stone-200"><CardContent className="p-6">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Today&apos;s Application</p>
            <p className="text-stone-700">Identify one situation where you can choose trust over control today.</p>
          </CardContent></Card>
        </div>
      </section>

      {/* Continue Your Journey */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Continue Your Journey</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/bible"><Card className="bg-white border-stone-200 hover:border-stone-300 transition-colors cursor-pointer h-full"><CardContent className="p-5">
            <BookOpen className="h-5 w-5 text-stone-400 mb-3" /><p className="text-sm font-medium text-stone-900 mb-1">Read Scripture</p><p className="text-xs text-stone-500">Continue where you left off</p>
          </CardContent></Card></Link>
          <Link href="/study"><Card className="bg-white border-stone-200 hover:border-stone-300 transition-colors cursor-pointer h-full"><CardContent className="p-5">
            <GraduationCap className="h-5 w-5 text-stone-400 mb-3" /><p className="text-sm font-medium text-stone-900 mb-1">Your Studies</p><p className="text-xs text-stone-500">Recently saved studies</p>
          </CardContent></Card></Link>
          <Link href="/ask"><Card className="bg-white border-stone-200 hover:border-stone-300 transition-colors cursor-pointer h-full"><CardContent className="p-5">
            <MessageCircle className="h-5 w-5 text-stone-400 mb-3" /><p className="text-sm font-medium text-stone-900 mb-1">Recent Conversations</p><p className="text-xs text-stone-500">Continue a previous discussion</p>
          </CardContent></Card></Link>
        </div>
      </section>

      {/* What Are You Facing? */}
      <section>
        <h2 className="text-lg font-semibold text-stone-900 mb-4">What Are You Facing?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {lifeCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.value} href={`/life?category=${category.value}`}>
                <Card className="bg-white border-stone-200 hover:border-stone-300 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Icon className="h-5 w-5 text-stone-500 shrink-0" /><span className="text-sm text-stone-700">{category.label}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
