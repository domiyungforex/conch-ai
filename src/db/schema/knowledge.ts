import { pgTable, text, timestamp, uuid, integer, index } from 'drizzle-orm/pg-core';

export const people = pgTable('people', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  shortDescription: text('short_description'),
  testament: text('testament'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const places = pgTable('places', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  shortDescription: text('short_description'),
  modernName: text('modern_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const themes = pgTable('themes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const entityRelationships = pgTable('entity_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceType: text('source_type').notNull(),
  sourceId: uuid('source_id').notNull(),
  targetType: text('target_type').notNull(),
  targetId: uuid('target_id').notNull(),
  relationship: text('relationship').notNull(),
  provenance: text('provenance'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  sourceIdx: index('idx_entity_rel_source').on(table.sourceType, table.sourceId),
  targetIdx: index('idx_entity_rel_target').on(table.targetType, table.targetId),
}));

export const versePeople = pgTable('verse_people', {
  id: uuid('id').primaryKey().defaultRandom(),
  verseId: uuid('verse_id').notNull(),
  personId: uuid('person_id').notNull().references(() => people.id),
}, (table) => ({ verseIdx: index('idx_verse_people_verse').on(table.verseId) }));

export const verseThemes = pgTable('verse_themes', {
  id: uuid('id').primaryKey().defaultRandom(),
  verseId: uuid('verse_id').notNull(),
  themeId: uuid('theme_id').notNull().references(() => themes.id),
});
