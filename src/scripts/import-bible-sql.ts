import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import postgres from 'postgres';
import { readFileSync } from 'fs';

interface BibleData {
  translation: { code: string; name: string; language: string; publisher: string; license: string; publicDomain: boolean; };
  books: { testament: string; name: string; shortName: string; bookOrder: number; chapters: { chapter: number; verses: { verse: number; text: string }[]; }[]; }[];
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 5 });
  
  const dataPath = process.argv[2] || 'data/kjv.json';
  console.log(`Reading from ${dataPath}...`);
  const data: BibleData = JSON.parse(readFileSync(resolve(process.cwd(), dataPath), 'utf-8'));

  // 1. Translation
  console.log(`\n1. Inserting translation: ${data.translation.name}`);
  let translationId: string;
  const existing = await sql`SELECT id FROM translations WHERE code = ${data.translation.code}`;
  if (existing.length > 0) {
    translationId = existing[0].id;
    console.log('  (exists, reusing)');
  } else {
    const [t] = await sql`INSERT INTO translations (code, name, language, publisher, license, public_domain) 
      VALUES (${data.translation.code}, ${data.translation.name}, ${data.translation.language}, 
              ${data.translation.publisher}, ${data.translation.license}, ${data.translation.publicDomain}) 
      RETURNING id`;
    translationId = t.id;
    console.log(`  ✓ Created`);
  }

  // 2. Books
  console.log(`\n2. Importing ${data.books.length} books...`);
  let totalVerses = 0;

  for (const bookData of data.books) {
    // Book
    const existingBook = await sql`SELECT id FROM bible_books WHERE name = ${bookData.name}`;
    let bookId: string;
    if (existingBook.length > 0) {
      bookId = existingBook[0].id;
    } else {
      const [b] = await sql`INSERT INTO bible_books (testament, name, short_name, book_order, chapter_count) 
        VALUES (${bookData.testament}, ${bookData.name}, ${bookData.shortName}, ${bookData.bookOrder}, ${bookData.chapters.length}) 
        RETURNING id`;
      bookId = b.id;
    }

    // Chapters & Verses
    for (const chData of bookData.chapters) {
      const existingCh = await sql`SELECT id FROM bible_chapters WHERE book_id = ${bookId} AND chapter_number = ${chData.chapter}`;
      let chapterId: string;
      if (existingCh.length > 0) {
        chapterId = existingCh[0].id;
      } else {
        const [c] = await sql`INSERT INTO bible_chapters (book_id, chapter_number) 
          VALUES (${bookId}, ${chData.chapter}) RETURNING id`;
        chapterId = c.id;
      }

      // Batch insert verses for this chapter
      for (const vData of chData.verses) {
        const [v] = await sql`INSERT INTO bible_verses (chapter_id, verse_number) 
          VALUES (${chapterId}, ${vData.verse}) RETURNING id`;
        await sql`INSERT INTO verse_text (verse_id, translation_id, text) 
          VALUES (${v.id}, ${translationId}, ${vData.text})`;
        totalVerses++;
      }
    }

    const vc = bookData.chapters.reduce((a, c) => a + c.verses.length, 0);
    console.log(`  ✓ ${bookData.name}: ${bookData.chapters.length}ch, ${vc}v`);
  }

  const [bookCount] = await sql`SELECT count(*)::int as count FROM bible_books`;
  const [verseCount] = await sql`SELECT count(*)::int as count FROM verse_text`;

  console.log(`\n✓ Import complete!`);
  console.log(`  Books: ${bookCount.count}`);
  console.log(`  Verse texts: ${verseCount.count}`);

  await sql.end();
}

main().catch(console.error);
