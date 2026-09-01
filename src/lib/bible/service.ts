import { db } from '@/db';
import { bibleBooks, bibleChapters, bibleVerses, verseText, translations } from '@/db/schema/bible';
import { eq, and, asc, sql } from 'drizzle-orm';

export interface BookInfo { id: string; testament: string; name: string; shortName: string; bookOrder: number; chapterCount: number; }
export interface VerseInfo { id: string; chapterId: string; verseNumber: number; text?: string; translation?: string; }

export class BibleService {
  async getBooks(testament?: 'old' | 'new'): Promise<BookInfo[]> {
    const query = db.select().from(bibleBooks).orderBy(asc(bibleBooks.bookOrder));
    if (testament) return await query.where(eq(bibleBooks.testament, testament));
    return await query;
  }
  async getBook(identifier: string): Promise<BookInfo | undefined> {
    const [book] = await db.select().from(bibleBooks).where(sql`${bibleBooks.name} ILIKE ${identifier} OR ${bibleBooks.shortName} ILIKE ${identifier}`).limit(1);
    return book;
  }
  async getChapters(bookId: string) {
    return await db.select().from(bibleChapters).where(eq(bibleChapters.bookId, bookId)).orderBy(asc(bibleChapters.chapterNumber));
  }
  async getChapterVerses(bookId: string, chapterNumber: number, translationCode: string = 'kjv'): Promise<VerseInfo[]> {
    const [translation] = await db.select().from(translations).where(eq(translations.code, translationCode)).limit(1);
    if (!translation) return [];
    const [chapter] = await db.select().from(bibleChapters).where(and(eq(bibleChapters.bookId, bookId), eq(bibleChapters.chapterNumber, chapterNumber))).limit(1);
    if (!chapter) return [];
    const verses = await db.execute(sql`SELECT bv.id, bv.chapter_id, bv.verse_number, vt.text, t.code as translation FROM bible_verses bv LEFT JOIN verse_text vt ON vt.verse_id = bv.id AND vt.translation_id = ${translation.id} LEFT JOIN translations t ON vt.translation_id = t.id WHERE bv.chapter_id = ${chapter.id} ORDER BY bv.verse_number ASC`);
    return verses.map((v: any) => ({ id: v.id, chapterId: v.chapter_id, verseNumber: parseInt(v.verse_number), text: v.text || '', translation: v.translation || translationCode }));
  }
  async getVerse(bookId: string, chapterNumber: number, verseNumber: number, translationCode: string = 'kjv'): Promise<VerseInfo | undefined> {
    const verses = await this.getChapterVerses(bookId, chapterNumber, translationCode);
    return verses.find(v => v.verseNumber === verseNumber);
  }
  async getTranslations() { return await db.select().from(translations); }
}
