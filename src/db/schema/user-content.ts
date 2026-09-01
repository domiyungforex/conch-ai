import { pgTable, text, timestamp, uuid, integer, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const bookmarks = pgTable('bookmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  verseId: uuid('verse_id').notNull(),
  label: text('label'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({ userIdx: index('idx_bookmarks_user').on(table.userId) }));

export const highlights = pgTable('highlights', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  verseId: uuid('verse_id').notNull(),
  color: text('color').default('#fbbf24'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({ userIdx: index('idx_highlights_user').on(table.userId) }));

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  verseId: uuid('verse_id'),
  title: text('title'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({ userIdx: index('idx_notes_user').on(table.userId) }));
