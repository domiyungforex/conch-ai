'use client';

import Link from 'next/link';
import { PenTool, GraduationCap, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function TeachPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Teach</h1>
        <p className="text-stone-500 mt-1">Create sermons, Bible studies, and teaching materials</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/teach/sermon">
          <Card className="bg-white border-stone-200 hover:border-stone-300 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <PenTool className="h-6 w-6 text-stone-400 mb-3" />
              <p className="text-sm font-medium text-stone-900 mb-1">Sermon Builder</p>
              <p className="text-xs text-stone-500">Create professional sermons with AI assistance</p>
            </CardContent>
          </Card>
        </Link>
        <Card className="bg-white border-stone-200 hover:border-stone-300 transition-colors cursor-pointer h-full">
          <CardContent className="p-6">
            <GraduationCap className="h-6 w-6 text-stone-400 mb-3" />
            <p className="text-sm font-medium text-stone-900 mb-1">Bible Study Builder</p>
            <p className="text-xs text-stone-500">Generate structured Bible study plans</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-stone-200 hover:border-stone-300 transition-colors cursor-pointer h-full">
          <CardContent className="p-6">
            <BookOpen className="h-6 w-6 text-stone-400 mb-3" />
            <p className="text-sm font-medium text-stone-900 mb-1">Research</p>
            <p className="text-xs text-stone-500">Deep research for sermon preparation</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
