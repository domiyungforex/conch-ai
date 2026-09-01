'use client';

import { useState } from 'react';
import { Bookmark, Highlighter, FileText, FolderOpen, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SavedPage() {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Saved</h1>
        <p className="text-stone-500 mt-1">Your bookmarks, highlights, notes, and collections</p>
      </div>
      <Tabs defaultValue="bookmarks" className="mb-8">
        <TabsList className="bg-white border border-stone-200 p-1 rounded-lg">
          <TabsTrigger value="bookmarks" className="data-[state=active]:bg-stone-900 data-[state=active]:text-white">
            <Bookmark className="h-4 w-4 mr-1.5" />Bookmarks
          </TabsTrigger>
          <TabsTrigger value="highlights" className="data-[state=active]:bg-stone-900 data-[state=active]:text-white">
            <Highlighter className="h-4 w-4 mr-1.5" />Highlights
          </TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:bg-stone-900 data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-1.5" />Notes
          </TabsTrigger>
          <TabsTrigger value="collections" className="data-[state=active]:bg-stone-900 data-[state=active]:text-white">
            <FolderOpen className="h-4 w-4 mr-1.5" />Collections
          </TabsTrigger>
        </TabsList>
        <div className="relative mt-4 mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input placeholder="Search your saved content..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-white" />
        </div>
        {['bookmarks', 'highlights', 'notes', 'collections'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card className="bg-white border-stone-200">
              <CardContent className="p-12 text-center text-stone-400">
                <p className="text-sm">No {tab} yet</p>
                <p className="text-xs mt-1">Start reading the Bible to save {tab}</p>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
