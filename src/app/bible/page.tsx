'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Highlighter,
  Bookmark,
  MessageCircle,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const OLD_TESTAMENT = [
  { name: 'Genesis', chapters: 50 },
  { name: 'Exodus', chapters: 40 },
  { name: 'Leviticus', chapters: 27 },
  { name: 'Numbers', chapters: 36 },
  { name: 'Deuteronomy', chapters: 34 },
  { name: 'Joshua', chapters: 24 },
  { name: 'Judges', chapters: 21 },
  { name: 'Ruth', chapters: 4 },
  { name: '1 Samuel', chapters: 31 },
  { name: '2 Samuel', chapters: 24 },
  { name: '1 Kings', chapters: 22 },
  { name: '2 Kings', chapters: 25 },
  { name: '1 Chronicles', chapters: 29 },
  { name: '2 Chronicles', chapters: 36 },
  { name: 'Ezra', chapters: 10 },
  { name: 'Nehemiah', chapters: 13 },
  { name: 'Esther', chapters: 10 },
  { name: 'Job', chapters: 42 },
  { name: 'Psalms', chapters: 150 },
  { name: 'Proverbs', chapters: 31 },
  { name: 'Ecclesiastes', chapters: 12 },
  { name: 'Song of Solomon', chapters: 8 },
  { name: 'Isaiah', chapters: 66 },
  { name: 'Jeremiah', chapters: 52 },
  { name: 'Lamentations', chapters: 5 },
  { name: 'Ezekiel', chapters: 48 },
  { name: 'Daniel', chapters: 12 },
  { name: 'Hosea', chapters: 14 },
  { name: 'Joel', chapters: 3 },
  { name: 'Amos', chapters: 9 },
  { name: 'Obadiah', chapters: 1 },
  { name: 'Jonah', chapters: 4 },
  { name: 'Micah', chapters: 7 },
  { name: 'Nahum', chapters: 3 },
  { name: 'Habakkuk', chapters: 3 },
  { name: 'Zephaniah', chapters: 3 },
  { name: 'Haggai', chapters: 2 },
  { name: 'Zechariah', chapters: 14 },
  { name: 'Malachi', chapters: 4 },
];

const NEW_TESTAMENT = [
  { name: 'Matthew', chapters: 28 },
  { name: 'Mark', chapters: 16 },
  { name: 'Luke', chapters: 24 },
  { name: 'John', chapters: 21 },
  { name: 'Acts', chapters: 28 },
  { name: 'Romans', chapters: 16 },
  { name: '1 Corinthians', chapters: 16 },
  { name: '2 Corinthians', chapters: 13 },
  { name: 'Galatians', chapters: 6 },
  { name: 'Ephesians', chapters: 6 },
  { name: 'Philippians', chapters: 4 },
  { name: 'Colossians', chapters: 4 },
  { name: '1 Thessalonians', chapters: 5 },
  { name: '2 Thessalonians', chapters: 3 },
  { name: '1 Timothy', chapters: 6 },
  { name: '2 Timothy', chapters: 4 },
  { name: 'Titus', chapters: 3 },
  { name: 'Philemon', chapters: 1 },
  { name: 'Hebrews', chapters: 13 },
  { name: 'James', chapters: 5 },
  { name: '1 Peter', chapters: 5 },
  { name: '2 Peter', chapters: 3 },
  { name: '1 John', chapters: 5 },
  { name: '2 John', chapters: 1 },
  { name: '3 John', chapters: 1 },
  { name: 'Jude', chapters: 1 },
  { name: 'Revelation', chapters: 22 },
];

type BibleView = 'books' | 'chapters' | 'reading';

export default function BiblePage() {
  const [view, setView] = useState<BibleView>('books');
  const [testament, setTestament] = useState<'old' | 'new'>('old');
  const [selectedBook, setSelectedBook] = useState<(typeof OLD_TESTAMENT)[0] | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const books = testament === 'old' ? OLD_TESTAMENT : NEW_TESTAMENT;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {view !== 'books' && (
            <Button variant="ghost" size="sm" onClick={() => setView(view === 'reading' ? 'chapters' : 'books')}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          <h1 className="text-2xl font-semibold text-stone-900">
            {view === 'books' && 'Bible'}
            {view === 'chapters' && selectedBook?.name}
            {view === 'reading' && `${selectedBook?.name} ${selectedChapter}`}
          </h1>
        </div>
      </div>

      {view === 'books' && (
        <div>
          <div className="flex gap-2 mb-6">
            <Button variant={testament === 'old' ? 'default' : 'outline'} size="sm" onClick={() => setTestament('old')}>Old Testament</Button>
            <Button variant={testament === 'new' ? 'default' : 'outline'} size="sm" onClick={() => setTestament('new')}>New Testament</Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {books.map((book) => (
              <button key={book.name} onClick={() => { setSelectedBook(book); setSelectedChapter(1); setView('chapters'); }}
                className="text-left p-3 rounded-lg border border-stone-200 hover:border-stone-300 hover:bg-white transition-colors">
                <p className="text-sm font-medium text-stone-900">{book.name}</p>
                <p className="text-xs text-stone-500">{book.chapters} chapters</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {view === 'chapters' && selectedBook && (
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => (
            <button key={ch} onClick={() => { setSelectedChapter(ch); setView('reading'); }}
              className="aspect-square flex items-center justify-center rounded-lg border border-stone-200 hover:border-stone-300 hover:bg-white transition-colors text-sm font-medium text-stone-700">
              {ch}
            </button>
          ))}
        </div>
      )}

      {view === 'reading' && selectedBook && (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" size="sm" onClick={() => selectedChapter > 1 && setSelectedChapter(selectedChapter - 1)} disabled={selectedChapter <= 1}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <span className="text-sm text-stone-500">{selectedBook.name} {selectedChapter}</span>
            <Button variant="ghost" size="sm" onClick={() => selectedChapter < selectedBook.chapters && setSelectedChapter(selectedChapter + 1)} disabled={selectedChapter >= selectedBook.chapters}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <article className="space-y-4">
            {Array.from({ length: Math.min(31, 30) }, (_, i) => i + 1).map((v) => (
              <div key={v} className="group flex gap-3 text-stone-800 leading-relaxed">
                <span className="text-xs text-stone-400 font-medium mt-1 shrink-0 w-6 text-right">{v}</span>
                <div className="flex-1 font-serif text-lg">
                  Scripture text for {selectedBook.name} {selectedChapter}:{v} will load from the database.
                </div>
                <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MessageCircle className="h-3.5 w-3.5 text-stone-400" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><BookOpen className="h-3.5 w-3.5 text-stone-400" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Highlighter className="h-3.5 w-3.5 text-stone-400" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Bookmark className="h-3.5 w-3.5 text-stone-400" /></Button>
                </div>
              </div>
            ))}
          </article>
        </div>
      )}
    </div>
  );
}
