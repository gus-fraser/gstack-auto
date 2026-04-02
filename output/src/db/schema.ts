import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  numeric,
  integer,
  uniqueIndex,
  index,
  serial,
} from 'drizzle-orm/pg-core'

// Custom pgvector column type
import { customType } from 'drizzle-orm/pg-core'

const vector = customType<{ data: number[]; driverParam: string }>({
  dataType() {
    return 'vector(1536)'
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value) as number[]
  },
})

// ─── Users ───────────────────────────────────────────────
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    role: varchar('role', { length: 10 }).notNull().default('lp'), // 'lp' | 'admin'
    lp_id: varchar('lp_id', { length: 100 }),
    lp_name: varchar('lp_name', { length: 255 }),
    email: varchar('email', { length: 255 }),
    magic_token_hash: text('magic_token_hash'),
    token_expires_at: timestamp('token_expires_at'),
    session_token_hash: text('session_token_hash'),
    session_expires_at: timestamp('session_expires_at'),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    lp_id_idx: uniqueIndex('users_lp_id_idx').on(table.lp_id),
    email_idx: index('users_email_idx').on(table.email),
  })
)

// ─── Documents ───────────────────────────────────────────
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: varchar('filename', { length: 500 }).notNull(),
  file_type: varchar('file_type', { length: 10 }).notNull(), // 'pdf' | 'csv'
  blob_url: text('blob_url').notNull(),
  size_bytes: integer('size_bytes').notNull(),
  chunk_count: integer('chunk_count').default(0),
  uploaded_at: timestamp('uploaded_at').notNull().defaultNow(),
})

// ─── Chunks (pgvector embeddings) ────────────────────────
export const chunks = pgTable(
  'chunks',
  {
    id: serial('id').primaryKey(),
    document_id: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    page_number: integer('page_number'),
    chunk_index: integer('chunk_index').notNull(),
    embedding: vector('embedding'),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    document_idx: index('chunks_document_idx').on(table.document_id),
  })
)

// ─── KPI Data (per-LP, per-period) ──────────────────────
export const kpiData = pgTable(
  'kpi_data',
  {
    id: serial('id').primaryKey(),
    lp_id: varchar('lp_id', { length: 100 }).notNull(),
    lp_name: varchar('lp_name', { length: 255 }).notNull(),
    report_date: varchar('report_date', { length: 20 }).notNull(), // YYYY-MM-DD or YYYY-QN
    commitment: numeric('commitment', { precision: 18, scale: 2 }).notNull(),
    called_capital: numeric('called_capital', { precision: 18, scale: 2 }).notNull(),
    nav: numeric('nav', { precision: 18, scale: 2 }).notNull(),
    distributions_to_date: numeric('distributions_to_date', { precision: 18, scale: 2 }).notNull(),
    irr: numeric('irr', { precision: 8, scale: 4 }).notNull(),
    tvpi: numeric('tvpi', { precision: 8, scale: 4 }).notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    lp_date_unique: uniqueIndex('kpi_lp_date_unique').on(table.lp_id, table.report_date),
    lp_idx: index('kpi_lp_idx').on(table.lp_id),
  })
)

// ─── Conversations ──────────────────────────────────────
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    user_idx: index('conversations_user_idx').on(table.user_id),
  })
)

// ─── Messages ───────────────────────────────────────────
export const messages = pgTable(
  'messages',
  {
    id: serial('id').primaryKey(),
    conversation_id: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 10 }).notNull(), // 'user' | 'assistant'
    content: text('content').notNull(),
    citations: text('citations'), // JSON string of citation objects
    confidence: numeric('confidence', { precision: 4, scale: 3 }), // 0.000 - 1.000
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    conversation_idx: index('messages_conversation_idx').on(table.conversation_id),
  })
)

// ─── Type exports ────────────────────────────────────────
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Document = typeof documents.$inferSelect
export type KpiRow = typeof kpiData.$inferSelect
export type Conversation = typeof conversations.$inferSelect
export type Message = typeof messages.$inferSelect
