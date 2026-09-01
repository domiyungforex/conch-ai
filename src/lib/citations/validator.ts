import { db } from '@/db';
import { bibleBooks, bibleChapters, bibleVerses, verseText } from '@/db/schema/bible';
import { eq, and } from 'drizzle-orm';
import type { ScriptureCitation } from '@/types';

export function parseReference(ref: string): { book: string; chapter: number; verseStart: number; verseEnd?: number } | null {
  const match = ref.trim().match(/^(\d?\s*[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return null;
  return { book: match[1].trim(), chapter: parseInt(match[2]), verseStart: parseInt(match[3]), verseEnd: match[4] ? parseInt(match[4]) : undefined };
}

export async function validateCitation(citation: ScriptureCitation): Promise<{ valid: boolean; citation: ScriptureCitation; errors: string[] }> {
  const errors: string[] = [];
  const parsed = parseReference(citation.reference);
  if (!parsed) return { valid: false, citation, errors: ['Could not parse reference format'] };
  const [book] = await db.select().from(bibleBooks).where(eq(bibleBooks.name, parsed.book)).limit(1);
  if (!book) return { valid: false, citation, errors: [`Book "${parsed.book}" not found`] };
  const [chapter] = await db.select().from(bibleChapters).where(and(eq(bibleChapters.bookId, book.id), eq(bibleChapters.chapterNumber, parsed.chapter))).limit(1);
  if (!chapter) return { valid: false, citation, errors: [`Chapter ${parsed.chapter} not found`] };
  const [verse] = await db.select().from(bibleVerses).where(and(eq(bibleVerses.chapterId, chapter.id), eq(bibleVerses.verseNumber, parsed.verseStart))).limit(1);
  if (!verse) return { valid: false, citation, errors: [`Verse ${parsed.verseStart} not found`] };
  return { valid: true, citation: { ...citation, verseId: verse.id, validated: true }, errors };
}

export async function validateCitations(citations: ScriptureCitation[]) {
  const validated: ScriptureCitation[] = [];
  const invalid: { citation: ScriptureCitation; errors: string[] }[] = [];
  for (const citation of citations) {
    const result = await validateCitation(citation);
    if (result.valid) validated.push(result.citation); else invalid.push({ citation, errors: result.errors });
  }
  return { validated, invalid };
}

export function extractCitations(text: string): ScriptureCitation[] {
  const citations: ScriptureCitation[] = [];
  const patterns = [/\[([A-Z][a-z]+\s+\d+:\d+(?:-\d+)?)\]/g, /\(([A-Z][a-z]+\s+\d+:\d+(?:-\d+)?)\)/g];
  const seen = new Set<string>();
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (!seen.has(match[1])) { seen.add(match[1]); citations.push({ reference: match[1], text: '', translation: 'unknown', verseId: '', validated: false }); }
    }
  }
  return citations;
}
