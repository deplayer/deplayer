import { serial, text, boolean, timestamp, pgTable, jsonb } from 'drizzle-orm/pg-core';

/**
 * Electric change log table schema for Drizzle ORM
 * This table tracks changes to synced tables for transmission to the server
 */
export const electricChangeLog = pgTable('_electric_change_log', {
  id: serial('id').primaryKey(),
  tableName: text('table_name').notNull(),
  rowId: text('row_id').notNull(),
  operation: text('operation').notNull(),
  changes: jsonb('changes').notNull().$type<Record<string, any>>(),
  synced: boolean('synced').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  error: text('error'),
});

// Type definition for change log entries
export type ChangeLogEntry = typeof electricChangeLog.$inferSelect; 