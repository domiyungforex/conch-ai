import { pgTable, text, timestamp, uuid, integer, boolean, index } from 'drizzle-orm/pg-core';

export const translations = pgTable('translations', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  language: text('language').notNull().default('en'),
  publisher: text('publisher'),
  license: text('license'),
  publicDomain: boolean('public_domain').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bibleBooks = pgTable('bible_books', {
  id: uuid('id').primaryKey().defaultRandom(),
  testament: text('testament').notNull(),
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  bookOrder: integer('book_order').notNull().unique(),
  chapterCount: integer('chapter_count').notNull(),
});

export const bibleChapters = pgTable('bible_chapters', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookId: uuid('book_id').notNull().references(() => bibleBooks.id, { onDelete: 'cascade' }),
  chapterNumber: integer('chapter_number').notNull(),
}, (table) => ({ bookChapterIdx: index('idx_chapter_book_number').on(table.bookId, table.chapterNumber) }));

export const bibleVerses = pgTable('bible_verses', {
  id: uuid('id').primaryKey().defaultRandom(),
  chapterId: uuid('chapter_id').notNull().references(() => bibleChapters.id, { onDelete: 'cascade' }),
  verseNumber: integer('verse_number').notNull(),
}, (table) => ({ chapterVerseIdx: index('idx_verse_chapter_number').on(table.chapterId, table.verseNumber) }));

export const verseText = pgTable('verse_text', {
  id: uuid('id').primaryKey().defaultRandom(),
  verseId: uuid('verse_id').notNull().references(() => bibleVerses.id, { onDelete: 'cascade' }),
  translationId: uuid('translation_id').notNull().references(() => translations.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
}, (table) => ({ verseTranslationIdx: index('idx_verse_text_verse_translation').on(table.verseId, table.translationId) }));
