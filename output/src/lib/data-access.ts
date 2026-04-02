import { db } from '@/db'
import { users, kpiData, documents, conversations, messages, chunks } from '@/db/schema'
import { eq, and, desc, sql, gt } from 'drizzle-orm'

// ─── LP Data Access (defense in depth: all queries scoped by lp_id) ──

export async function getKpiForLp(lpId: string) {
  return db
    .select()
    .from(kpiData)
    .where(eq(kpiData.lp_id, lpId))
    .orderBy(desc(kpiData.report_date))
}

export async function getLatestKpiForLp(lpId: string) {
  const [latest] = await db
    .select()
    .from(kpiData)
    .where(eq(kpiData.lp_id, lpId))
    .orderBy(desc(kpiData.report_date))
    .limit(1)
  return latest ?? null
}

// ─── Fund Aggregation (no LP filtering — aggregate view) ──────────

export async function getFundOverview() {
  const periods = await db
    .select({
      report_date: kpiData.report_date,
      total_nav: sql<string>`SUM(${kpiData.nav})`,
      total_distributions: sql<string>`SUM(${kpiData.distributions_to_date})`,
      total_commitment: sql<string>`SUM(${kpiData.commitment})`,
      total_called_capital: sql<string>`SUM(${kpiData.called_capital})`,
      lp_count: sql<number>`COUNT(DISTINCT ${kpiData.lp_id})`,
    })
    .from(kpiData)
    .groupBy(kpiData.report_date)
    .orderBy(desc(kpiData.report_date))
  return periods
}

// ─── Users ─────────────────────────────────────────────────────────

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1)
  return user ?? null
}

export async function getUserById(id: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
  return user ?? null
}

export async function getAllLps() {
  return db
    .select({
      id: users.id,
      lp_id: users.lp_id,
      lp_name: users.lp_name,
      email: users.email,
      created_at: users.created_at,
    })
    .from(users)
    .where(eq(users.role, 'lp'))
    .orderBy(users.lp_name)
}

export async function getLpById(id: string) {
  const [lp] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.role, 'lp')))
    .limit(1)
  return lp ?? null
}

export async function updateLpEmail(id: string, email: string) {
  const [updated] = await db
    .update(users)
    .set({ email: email.toLowerCase().trim(), updated_at: new Date() })
    .where(and(eq(users.id, id), eq(users.role, 'lp')))
    .returning()
  return updated ?? null
}

// ─── Documents ─────────────────────────────────────────────────────

export async function getDocuments(fileType?: 'pdf' | 'csv') {
  const query = db
    .select({
      id: documents.id,
      filename: documents.filename,
      file_type: documents.file_type,
      size_bytes: documents.size_bytes,
      uploaded_at: documents.uploaded_at,
    })
    .from(documents)
    .orderBy(desc(documents.uploaded_at))

  if (fileType) {
    return query.where(eq(documents.file_type, fileType))
  }
  return query
}

// ─── Conversations ─────────────────────────────────────────────────

export async function getConversationForUser(userId: string) {
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.user_id, userId))
    .limit(1)
  return conv ?? null
}

export async function getMessagesForConversation(conversationId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversation_id, conversationId))
    .orderBy(messages.created_at)
}

// ─── Admin: Question Log ───────────────────────────────────────────

export async function getRecentQuestions(limit = 50) {
  return db
    .select({
      id: messages.id,
      content: messages.content,
      role: messages.role,
      created_at: messages.created_at,
      conversation_id: messages.conversation_id,
    })
    .from(messages)
    .where(eq(messages.role, 'user'))
    .orderBy(desc(messages.created_at))
    .limit(limit)
}
