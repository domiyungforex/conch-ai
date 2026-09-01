'use client';

import { useState } from 'react';
import { Users, MapPin, Calendar, Tag, Scroll, Handshake, Sparkles, BookOpen, GraduationCap, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const categories = [
  { value: 'people', label: 'People', icon: Users, count: 3200 },
  { value: 'places', label: 'Places', icon: MapPin, count: 500 },
  { value: 'events', label: 'Events', icon: Calendar, count: 1200 },
  { value: 'themes', label: 'Themes', icon: Tag, count: 200 },
  { value: 'prophecies', label: 'Prophecies', icon: Scroll, count: 400 },
  { value: 'covenants', label: 'Covenants', icon: Handshake, count: 8 },
  { value: 'miracles', label: 'Miracles', icon: Sparkles, count: 35 },
  { value: 'parables', label: 'Parables', icon: BookOpen, count: 40 },
  { value: 'teachings', label: 'Teachings', icon: GraduationCap, count: 150 },
];

const featuredPeople = [
  { name: 'David', description: 'King of Israel, psalmist, warrior' },
  { name: 'Moses', description: 'Lawgiver, prophet, deliverer' },
  { name: 'Paul', description: 'Apostle, missionary, theologian' },
  { name: 'Esther', description: 'Queen of Persia, deliverer of her people' },
  { name: 'Abraham', description: 'Father of faith, patriarch' },
  { name: 'Ruth', description: 'Woman of loyalty and faith' },
];

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Discover</h1>
        <p className="text-stone-500 mt-1">Explore the biblical knowledge graph</p>
      </div>
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <Input placeholder="Search people, places, events, themes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-white" />
      </div>
      <section className="mb-12">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button key={cat.value} className="text-left p-4 rounded-xl border border-stone-200 hover:border-stone-300 bg-white transition-colors">
                <Icon className="h-5 w-5 mb-2 text-stone-400" />
                <p className="text-sm font-medium text-stone-900">{cat.label}</p>
                <p className="text-xs text-stone-500">{cat.count} entries</p>
              </button>
            );
          })}
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Featured People</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {featuredPeople.map((person) => (
            <Card key={person.name} className="bg-white border-stone-200 hover:border-stone-300 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-stone-900 mb-1">{person.name}</p>
                <p className="text-xs text-stone-500">{person.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
