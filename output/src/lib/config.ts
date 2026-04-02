import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ADMIN_SECRET: z.string().min(8, 'ADMIN_SECRET must be at least 8 characters'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  RESEND_FROM_EMAIL: z.string().email('RESEND_FROM_EMAIL must be a valid email'),
  BLOB_READ_WRITE_TOKEN: z.string().min(1, 'BLOB_READ_WRITE_TOKEN is required'),
  FUND_NAME: z.string().default('Hudson Capital'),
  FUND_LOGO_URL: z.string().default('/placeholder-logo.svg'),
  FUND_ACCENT_COLOR: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color').default('#3b82f6'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
})

// Validate at import time -- fail fast
function getConfig() {
  // In test environment, skip validation
  if (process.env.VITEST) {
    return {
      databaseUrl: process.env.DATABASE_URL ?? '',
      adminSecret: process.env.ADMIN_SECRET ?? 'test-secret',
      openaiApiKey: process.env.OPENAI_API_KEY ?? '',
      resendApiKey: process.env.RESEND_API_KEY ?? '',
      resendFromEmail: process.env.RESEND_FROM_EMAIL ?? 'test@test.com',
      blobToken: process.env.BLOB_READ_WRITE_TOKEN ?? '',
      fundName: process.env.FUND_NAME ?? 'Hudson Capital',
      fundLogoUrl: process.env.FUND_LOGO_URL ?? '/placeholder-logo.svg',
      fundAccentColor: process.env.FUND_ACCENT_COLOR ?? '#3b82f6',
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    }
  }

  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')
    throw new Error(`Environment validation failed:\n${errors}`)
  }

  return {
    databaseUrl: parsed.data.DATABASE_URL,
    adminSecret: parsed.data.ADMIN_SECRET,
    openaiApiKey: parsed.data.OPENAI_API_KEY,
    resendApiKey: parsed.data.RESEND_API_KEY,
    resendFromEmail: parsed.data.RESEND_FROM_EMAIL,
    blobToken: parsed.data.BLOB_READ_WRITE_TOKEN,
    fundName: parsed.data.FUND_NAME,
    fundLogoUrl: parsed.data.FUND_LOGO_URL,
    fundAccentColor: parsed.data.FUND_ACCENT_COLOR,
    appUrl: parsed.data.NEXT_PUBLIC_APP_URL,
  }
}

export const config = getConfig()
