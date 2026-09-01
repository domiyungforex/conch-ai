import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  preferredTranslation: text('preferred_translation').default('kjv'),
  theme: text('theme').default('light'),
  fontSize: text('font_size').default('medium'),
  memoryEnabled: text('memory_enabled').default('true'),
  showVerseNumbers: text('show_verse_numbers').default('true'),
  dailyReminder: text('daily_reminder').default('false'),
  reminderTime: text('reminder_time').default('08:00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
