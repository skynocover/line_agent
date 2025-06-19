// db/schema.ts
import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable, index } from 'drizzle-orm/sqlite-core';

// 定義檔案表
export const files = sqliteTable(
  'files',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    fileId: text('file_id').notNull().unique(),
    userId: text('user_id').notNull(),
    fileName: text('file_name').notNull(),
    fileSize: integer('file_size').notNull(),
    mimeType: text('mime_type').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [index('user_idx').on(table.userId)],
);

// 定義使用者表
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// 定義行事曆事件表
export const calendarEvents = sqliteTable(
  'calendar_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    description: text('description'),
    start: integer('start', { mode: 'timestamp' }).notNull(),
    end: integer('end', { mode: 'timestamp' }).notNull(),
    allDay: integer('all_day', { mode: 'boolean' }).default(false),
    color: text('color'),
    label: text('label'),
    location: text('location'),
    completed: integer('completed', { mode: 'boolean' }).default(false),
    userId: text('user_id').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [index('user_events_idx').on(table.userId)],
);

export type Newfile = typeof files.$inferInsert;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;
