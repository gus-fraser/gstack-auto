import { z } from 'zod'
import { db } from '@/db'
import { kpiData, users } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

// ─── CSV Schema ──────────────────────────────────────────

const REQUIRED_COLUMNS = [
  'report_date',
  'lp_id',
  'lp_name',
  'commitment',
  'called_capital',
  'nav',
  'distributions_to_date',
  'irr',
  'tvpi',
] as const

const OPTIONAL_COLUMNS = ['lp_email', 'capital_calls_to_date', 'unfunded_commitment', 'notes'] as const

const rowSchema = z.object({
  report_date: z.string().min(1),
  lp_id: z.string().min(1),
  lp_name: z.string().min(1),
  commitment: z.string().transform(parseNumeric),
  called_capital: z.string().transform(parseNumeric),
  nav: z.string().transform(parseNumeric),
  distributions_to_date: z.string().transform(parseNumeric),
  irr: z.string().transform(parseNumeric),
  tvpi: z.string().transform(parseNumeric),
  lp_email: z.string().email().optional().or(z.literal('')),
})

function parseNumeric(val: string): string {
  const cleaned = val.replace(/[$,%\s]/g, '')
  const num = Number(cleaned)
  if (isNaN(num)) throw new Error(`Invalid numeric value: "${val}"`)
  return cleaned
}

// ─── CSV Parsing ─────────────────────────────────────────

export interface CsvParseResult {
  rows: number
  lps_found: number
  lps_created: number
  periods: string[]
}

export function validateCsvColumns(headerLine: string): { valid: boolean; missing: string[] } {
  const headers = headerLine
    .split(',')
    .map((h) => h.trim().toLowerCase().replace(/['"]/g, ''))

  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col))
  return { valid: missing.length === 0, missing }
}

export function parseCsvRows(csvContent: string): Array<z.infer<typeof rowSchema>> {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) {
    throw new CsvParseError('CSV must have a header row and at least one data row')
  }

  const headers = lines[0]!
    .split(',')
    .map((h) => h.trim().toLowerCase().replace(/['"]/g, ''))

  const validation = validateCsvColumns(lines[0]!)
  if (!validation.valid) {
    throw new CsvParseError(`Missing required columns: ${validation.missing.join(', ')}`)
  }

  const rows: Array<z.infer<typeof rowSchema>> = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim()
    if (!line) continue

    const values = parseCsvLine(line)
    const record: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]!] = values[j]?.trim().replace(/^["']|["']$/g, '') ?? ''
    }

    const parsed = rowSchema.safeParse(record)
    if (!parsed.success) {
      const errors = parsed.error.issues.map((e) => e.message).join('; ')
      throw new CsvParseError(`Row ${i + 1}: ${errors}`)
    }
    rows.push(parsed.data)
  }

  return rows
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (const char of line) {
    if (char === '"' && !inQuotes) {
      inQuotes = true
    } else if (char === '"' && inQuotes) {
      inQuotes = false
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

// ─── Database Operations ─────────────────────────────────

export async function importCsvToDb(csvContent: string): Promise<CsvParseResult> {
  const rows = parseCsvRows(csvContent)
  const lpIds = new Set<string>()
  const periods = new Set<string>()
  let lpsCreated = 0

  for (const row of rows) {
    lpIds.add(row.lp_id)
    periods.add(row.report_date)

    // Upsert KPI data
    const existing = await db
      .select({ id: kpiData.id })
      .from(kpiData)
      .where(and(eq(kpiData.lp_id, row.lp_id), eq(kpiData.report_date, row.report_date)))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(kpiData)
        .set({
          lp_name: row.lp_name,
          commitment: row.commitment,
          called_capital: row.called_capital,
          nav: row.nav,
          distributions_to_date: row.distributions_to_date,
          irr: row.irr,
          tvpi: row.tvpi,
          updated_at: new Date(),
        })
        .where(eq(kpiData.id, existing[0]!.id))
    } else {
      await db.insert(kpiData).values({
        lp_id: row.lp_id,
        lp_name: row.lp_name,
        report_date: row.report_date,
        commitment: row.commitment,
        called_capital: row.called_capital,
        nav: row.nav,
        distributions_to_date: row.distributions_to_date,
        irr: row.irr,
        tvpi: row.tvpi,
      })
    }

    // Seed LP user stubs
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.lp_id, row.lp_id))
      .limit(1)

    if (!existingUser) {
      await db.insert(users).values({
        role: 'lp',
        lp_id: row.lp_id,
        lp_name: row.lp_name,
        email: row.lp_email || null,
      })
      lpsCreated++
    }
  }

  return {
    rows: rows.length,
    lps_found: lpIds.size,
    lps_created: lpsCreated,
    periods: Array.from(periods),
  }
}

// ─── Error Type ─────────────────────────────────────────

export class CsvParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CsvParseError'
  }
}
