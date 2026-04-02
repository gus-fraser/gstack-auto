import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// ─── Token Utilities ─────────────────────────────────────

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// ─── Magic Link ──────────────────────────────────────────

const MAGIC_LINK_EXPIRY_MINUTES = 15
const SESSION_EXPIRY_DAYS = 7

export async function createMagicLink(email: string): Promise<{ token: string; user: typeof users.$inferSelect } | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1)

  if (!user) return null

  const token = generateToken()
  const tokenHash = sha256(token)
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000)

  await db
    .update(users)
    .set({
      magic_token_hash: tokenHash,
      token_expires_at: expiresAt,
      updated_at: new Date(),
    })
    .where(eq(users.id, user.id))

  return { token, user }
}

export async function verifyMagicLink(token: string): Promise<typeof users.$inferSelect | null> {
  const tokenHash = sha256(token)
  const now = new Date()

  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.magic_token_hash, tokenHash),
        gt(users.token_expires_at, now)
      )
    )
    .limit(1)

  if (!user) return null

  // Clear magic token (single use)
  await db
    .update(users)
    .set({
      magic_token_hash: null,
      token_expires_at: null,
      updated_at: new Date(),
    })
    .where(eq(users.id, user.id))

  return user
}

// ─── Session Management ─────────────────────────────────

export async function createSession(userId: string): Promise<string> {
  const sessionToken = generateToken()
  const sessionHash = sha256(sessionToken)
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

  await db
    .update(users)
    .set({
      session_token_hash: sessionHash,
      session_expires_at: expiresAt,
      updated_at: new Date(),
    })
    .where(eq(users.id, userId))

  return sessionToken
}

export async function getSession(): Promise<typeof users.$inferSelect | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session')?.value
  if (!sessionToken) return null

  const sessionHash = sha256(sessionToken)
  const now = new Date()

  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.session_token_hash, sessionHash),
        gt(users.session_expires_at, now)
      )
    )
    .limit(1)

  return user ?? null
}

export async function requireAuth(): Promise<typeof users.$inferSelect> {
  const user = await getSession()
  if (!user) {
    throw new AuthError('Unauthorized', 401)
  }
  return user
}

export async function requireAdmin(): Promise<typeof users.$inferSelect> {
  const user = await requireAuth()
  if (user.role !== 'admin') {
    throw new AuthError('Forbidden', 403)
  }
  return user
}

// ─── Admin Auth ─────────────────────────────────────────

export function verifyAdminSecret(secret: string): boolean {
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) return false
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(secret),
    Buffer.from(adminSecret)
  )
}

export async function getOrCreateAdmin(): Promise<typeof users.$inferSelect> {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.role, 'admin'))
    .limit(1)

  if (existing) return existing

  const [admin] = await db
    .insert(users)
    .values({ role: 'admin', lp_id: null, lp_name: 'Admin' })
    .returning()

  return admin!
}

// ─── Error Type ─────────────────────────────────────────

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message)
    this.name = 'AuthError'
  }
}
