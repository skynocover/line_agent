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
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index('user_idx').on(table.userId)],
);

// 定義使用者表
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export type Newfile = typeof files.$inferInsert;
