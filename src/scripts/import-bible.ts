import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}
console.log(`Connecting to: ${process.env.DATABASE_URL.replace(/:[^@]+@/, ':***@')}`);

import { readFileSync } from 'fs';

interface BibleData {
  translation: { code: string; name: string; language: string; publisher: string; license: string; publicDomain: boolean; };
  books: { testament: string; name: string; shortName: string; bookOrder: number; chapters: { chapter: number; verses: { verse: number; text: string }[]; }[]; }[];
}

async function main() {
  // Dynamic imports after dotenv is loaded
  const { db } = await import('../db');
  const { translations, bibleBooks, bibleChapters, bibleVerses, verseText } = await import('../db/schema/bible');
  const { eq, and, sql } = await import('drizzle-orm');

  const dataPath = process.argv[2] || 'data/kjv.json';
  console.log(`Reading from ${dataPath}...`);
  const data: BibleData = JSON.parse(readFileSync(resolve(process.cwd(), dataPath), 'utf-8'));

  // 1. Translation
  console.log(`\n1. Translation: ${data.translation.name}`);
  let translationId: string;
  const [existing] = await db.select().from(translations).where(eq(translations.code, data.translation.code)).limit(1);
  if (existing) {
    translationId = existing.id;
    console.log('  (exists, reusing)');
  } else {
    const [t] = await db.insert(translations).values({
      code: data.translation.code, name: data.translation.name, language: data.translation.language,
      publisher: data.translation.publisher, license: data.translation.license, publicDomain: data.translation.publicDomain,
    }).returning({ id: translations.id });
    translationId = t.id;
    console.log(`  ✓ Created: ${translationId}`);
  }

  // 2. Books, chapters, verses
  console.log(`\n2. Importing ${data.books.length} books...`);

  for (let i = 0; i < data.books.length; i++) {
    const bookData = data.books[i];

    const [existingBook] = await db.select().from(bibleBooks).where(eq(bibleBooks.name, bookData.name)).limit(1);
    let bookId: string;
    if (existingBook) {
      bookId = existingBook.id;
    } else {
      const [b] = await db.insert(bibleBooks).values({
        testament: bookData.testament, name: bookData.name, shortName: bookData.shortName,
        bookOrder: bookData.bookOrder, chapterCount: bookData.chapters.length,
      }).returning({ id: bibleBooks.id });
      bookId = b.id;
    }

    for (const chData of bookData.chapters) {
      const [existingCh] = await db.select().from(bibleChapters)
        .where(and(eq(bibleChapters.bookId, bookId), eq(bibleChapters.chapterNumber, chData.chapter))).limit(1);
      let chapterId: string;
      if (existingCh) {
        chapterId = existingCh.id;
      } else {
        const [c] = await db.insert(bibleChapters).values({ bookId, chapterNumber: chData.chapter }).returning({ id: bibleChapters.id });
        chapterId = c.id;
      }

      for (const vData of chData.verses) {
        const [existingV] = await db.select().from(bibleVerses)
          .where(and(eq(bibleVerses.chapterId, chapterId), eq(bibleVerses.verseNumber, vData.verse))).limit(1);
        let verseId: string;
        if (existingV) {
          verseId = existingV.id;
        } else {
          const [v] = await db.insert(bibleVerses).values({ chapterId, verseNumber: vData.verse }).returning({ id: bibleVerses.id });
          verseId = v.id;
        }
        await db.insert(verseText).values({ verseId, translationId, text: vData.text }).onConflictDoNothing();
      }
    }

    const vc = bookData.chapters.reduce((a: number, c: any) => a + c.verses.length, 0);
    console.log(`  ✓ ${bookData.name}: ${bookData.chapters.length}ch, ${vc}v`);
  }

  const [{ count: bookCount }] = await db.select({ count: sql`count(*)::int` }).from(bibleBooks);
  const [{ count: verseCount }] = await db.select({ count: sql`count(*)::int` }).from(verseText);

  console.log(`\n✓ Import complete!`);
  console.log(`  Books: ${bookCount}`);
  console.log(`  Verse texts: ${verseCount}`);
}

main().catch(console.error);
