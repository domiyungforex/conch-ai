const BASE_URL = 'https://raw.githubusercontent.com/aruljohn/Bible-kjv/master';

// Maps: display name -> GitHub filename
const BOOKS = [
  { testament: 'old', name: 'Genesis', file: 'Genesis', shortName: 'Gen', order: 1 },
  { testament: 'old', name: 'Exodus', file: 'Exodus', shortName: 'Exod', order: 2 },
  { testament: 'old', name: 'Leviticus', file: 'Leviticus', shortName: 'Lev', order: 3 },
  { testament: 'old', name: 'Numbers', file: 'Numbers', shortName: 'Num', order: 4 },
  { testament: 'old', name: 'Deuteronomy', file: 'Deuteronomy', shortName: 'Deut', order: 5 },
  { testament: 'old', name: 'Joshua', file: 'Joshua', shortName: 'Josh', order: 6 },
  { testament: 'old', name: 'Judges', file: 'Judges', shortName: 'Judg', order: 7 },
  { testament: 'old', name: 'Ruth', file: 'Ruth', shortName: 'Ruth', order: 8 },
  { testament: 'old', name: '1 Samuel', file: '1Samuel', shortName: '1Sam', order: 9 },
  { testament: 'old', name: '2 Samuel', file: '2Samuel', shortName: '2Sam', order: 10 },
  { testament: 'old', name: '1 Kings', file: '1Kings', shortName: '1Kgs', order: 11 },
  { testament: 'old', name: '2 Kings', file: '2Kings', shortName: '2Kgs', order: 12 },
  { testament: 'old', name: '1 Chronicles', file: '1Chronicles', shortName: '1Chr', order: 13 },
  { testament: 'old', name: '2 Chronicles', file: '2Chronicles', shortName: '2Chr', order: 14 },
  { testament: 'old', name: 'Ezra', file: 'Ezra', shortName: 'Ezra', order: 15 },
  { testament: 'old', name: 'Nehemiah', file: 'Nehemiah', shortName: 'Neh', order: 16 },
  { testament: 'old', name: 'Esther', file: 'Esther', shortName: 'Esth', order: 17 },
  { testament: 'old', name: 'Job', file: 'Job', shortName: 'Job', order: 18 },
  { testament: 'old', name: 'Psalms', file: 'Psalms', shortName: 'Ps', order: 19 },
  { testament: 'old', name: 'Proverbs', file: 'Proverbs', shortName: 'Prov', order: 20 },
  { testament: 'old', name: 'Ecclesiastes', file: 'Ecclesiastes', shortName: 'Eccl', order: 21 },
  { testament: 'old', name: 'Song of Solomon', file: 'SongofSolomon', shortName: 'Song', order: 22 },
  { testament: 'old', name: 'Isaiah', file: 'Isaiah', shortName: 'Isa', order: 23 },
  { testament: 'old', name: 'Jeremiah', file: 'Jeremiah', shortName: 'Jer', order: 24 },
  { testament: 'old', name: 'Lamentations', file: 'Lamentations', shortName: 'Lam', order: 25 },
  { testament: 'old', name: 'Ezekiel', file: 'Ezekiel', shortName: 'Ezek', order: 26 },
  { testament: 'old', name: 'Daniel', file: 'Daniel', shortName: 'Dan', order: 27 },
  { testament: 'old', name: 'Hosea', file: 'Hosea', shortName: 'Hos', order: 28 },
  { testament: 'old', name: 'Joel', file: 'Joel', shortName: 'Joel', order: 29 },
  { testament: 'old', name: 'Amos', file: 'Amos', shortName: 'Amos', order: 30 },
  { testament: 'old', name: 'Obadiah', file: 'Obadiah', shortName: 'Obad', order: 31 },
  { testament: 'old', name: 'Jonah', file: 'Jonah', shortName: 'Jonah', order: 32 },
  { testament: 'old', name: 'Micah', file: 'Micah', shortName: 'Mic', order: 33 },
  { testament: 'old', name: 'Nahum', file: 'Nahum', shortName: 'Nah', order: 34 },
  { testament: 'old', name: 'Habakkuk', file: 'Habakkuk', shortName: 'Hab', order: 35 },
  { testament: 'old', name: 'Zephaniah', file: 'Zephaniah', shortName: 'Zeph', order: 36 },
  { testament: 'old', name: 'Haggai', file: 'Haggai', shortName: 'Hag', order: 37 },
  { testament: 'old', name: 'Zechariah', file: 'Zechariah', shortName: 'Zech', order: 38 },
  { testament: 'old', name: 'Malachi', file: 'Malachi', shortName: 'Mal', order: 39 },
  { testament: 'new', name: 'Matthew', file: 'Matthew', shortName: 'Matt', order: 40 },
  { testament: 'new', name: 'Mark', file: 'Mark', shortName: 'Mark', order: 41 },
  { testament: 'new', name: 'Luke', file: 'Luke', shortName: 'Luke', order: 42 },
  { testament: 'new', name: 'John', file: 'John', shortName: 'John', order: 43 },
  { testament: 'new', name: 'Acts', file: 'Acts', shortName: 'Acts', order: 44 },
  { testament: 'new', name: 'Romans', file: 'Romans', shortName: 'Rom', order: 45 },
  { testament: 'new', name: '1 Corinthians', file: '1Corinthians', shortName: '1Cor', order: 46 },
  { testament: 'new', name: '2 Corinthians', file: '2Corinthians', shortName: '2Cor', order: 47 },
  { testament: 'new', name: 'Galatians', file: 'Galatians', shortName: 'Gal', order: 48 },
  { testament: 'new', name: 'Ephesians', file: 'Ephesians', shortName: 'Eph', order: 49 },
  { testament: 'new', name: 'Philippians', file: 'Philippians', shortName: 'Phil', order: 50 },
  { testament: 'new', name: 'Colossians', file: 'Colossians', shortName: 'Col', order: 51 },
  { testament: 'new', name: '1 Thessalonians', file: '1Thessalonians', shortName: '1Thess', order: 52 },
  { testament: 'new', name: '2 Thessalonians', file: '2Thessalonians', shortName: '2Thess', order: 53 },
  { testament: 'new', name: '1 Timothy', file: '1Timothy', shortName: '1Tim', order: 54 },
  { testament: 'new', name: '2 Timothy', file: '2Timothy', shortName: '2Tim', order: 55 },
  { testament: 'new', name: 'Titus', file: 'Titus', shortName: 'Titus', order: 56 },
  { testament: 'new', name: 'Philemon', file: 'Philemon', shortName: 'Phlm', order: 57 },
  { testament: 'new', name: 'Hebrews', file: 'Hebrews', shortName: 'Heb', order: 58 },
  { testament: 'new', name: 'James', file: 'James', shortName: 'Jas', order: 59 },
  { testament: 'new', name: '1 Peter', file: '1Peter', shortName: '1Pet', order: 60 },
  { testament: 'new', name: '2 Peter', file: '2Peter', shortName: '2Pet', order: 61 },
  { testament: 'new', name: '1 John', file: '1John', shortName: '1John', order: 62 },
  { testament: 'new', name: '2 John', file: '2John', shortName: '2John', order: 63 },
  { testament: 'new', name: '3 John', file: '3John', shortName: '3John', order: 64 },
  { testament: 'new', name: 'Jude', file: 'Jude', shortName: 'Jude', order: 65 },
  { testament: 'new', name: 'Revelation', file: 'Revelation', shortName: 'Rev', order: 66 },
];

async function main() {
  console.log('Fetching KJV from GitHub (aruljohn/Bible-kjv)...\n');
  const allBooks: any[] = [];
  let totalVerses = 0;

  for (const book of BOOKS) {
    const url = `${BASE_URL}/${book.file}.json`;
    process.stdout.write(`  ${book.name}... `);
    try {
      const res = await fetch(url);
      if (!res.ok) { console.log(`✗ (${res.status})`); continue; }
      const data = await res.json();
      const chapters: any[] = [];
      const rawChapters = data.chapters || [];
      for (const ch of rawChapters) {
        const verses = (ch.verses || []).map((v: any) => ({ verse: parseInt(v.verse), text: v.text }));
        if (verses.length > 0) chapters.push({ chapter: ch.chapter, verses });
      }
      allBooks.push({ testament: book.testament, name: book.name, shortName: book.shortName, bookOrder: book.order, chapters });
      const vc = chapters.reduce((a: number, c: any) => a + c.verses.length, 0);
      totalVerses += vc;
      console.log(`✓ (${chapters.length}ch, ${vc}v)`);
    } catch (err) { console.log(`✗ (${err})`); }
  }

  const output = { translation: { code: 'kjv', name: 'King James Version', language: 'en', publisher: 'Public Domain', license: 'Public Domain', publicDomain: true }, books: allBooks };
  const fs = await import('fs');
  const path = await import('path');
  fs.writeFileSync(path.join(process.cwd(), 'data', 'kjv.json'), JSON.stringify(output));
  console.log(`\n✓ Saved: ${allBooks.length} books, ${totalVerses} verses`);
}

main().catch(console.error);
