import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { vector } from 'drizzle-orm/pg-core';
import { bibleVerses, translations } from './bible';

export const verseEmbeddings = pgTable('verse_embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  verseId: uuid('verse_id').notNull().references(() => bibleVerses.id, { onDelete: 'cascade' }),
  translationId: uuid('translation_id').notNull().references(() => translations.id, { onDelete: 'cascade' }),
  embedding: vector('embedding', { dimensions: 1536 }),
  model: text('model').notNull().default('text-embedding-3-small'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  embeddingIdx: index('idx_verse_embeddings_hnsw').using('hnsw', table.embedding.op('vector_cosine_ops')),
  verseIdx: index('idx_verse_embeddings_verse').on(table.verseId),
}));
