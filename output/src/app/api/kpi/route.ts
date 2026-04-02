import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/db'
import { kpiData } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const user = await requireAuth()

    // Defense in depth: LP must have an lp_id
    if (user.role === 'lp' && !user.lp_id) {
      return NextResponse.json(
        { error: 'Account not linked to LP data' },
        { status: 403 }
      )
    }

    // CRITICAL: Filter by the authenticated user's lp_id ONLY.
    // No lp_id query parameter accepted. No way to request another LP's data.
    const rows = await db
      .select()
      .from(kpiData)
      .where(eq(kpiData.lp_id, user.lp_id!))
      .orderBy(desc(kpiData.report_date))

    if (rows.length === 0) {
      return NextResponse.json({ data: [], latest: null })
    }

    const latest = rows[0]!
    const prior = rows.length > 1 ? rows[1] : null

    // Compute trends only if prior period exists
    const trends = prior
      ? {
          nav: computeTrend(latest.nav, prior.nav),
          irr: computeTrend(latest.irr, prior.irr),
          tvpi: computeTrend(latest.tvpi, prior.tvpi),
          distributions: computeTrend(latest.distributions_to_date, prior.distributions_to_date),
          commitment: computeTrend(latest.commitment, prior.commitment),
          called_capital: computeTrend(latest.called_capital, prior.called_capital),
        }
      : null

    return NextResponse.json({
      latest: {
        report_date: latest.report_date,
        lp_name: latest.lp_name,
        commitment: latest.commitment,
        called_capital: latest.called_capital,
        nav: latest.nav,
        distributions_to_date: latest.distributions_to_date,
        irr: latest.irr,
        tvpi: latest.tvpi,
      },
      trends,
      history: rows.map((r) => ({
        report_date: r.report_date,
        nav: r.nav,
        distributions_to_date: r.distributions_to_date,
      })),
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const authErr = error as { message: string; statusCode: number }
      return NextResponse.json(
        { error: authErr.message },
        { status: authErr.statusCode }
      )
    }
    console.error('KPI route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function computeTrend(current: string, previous: string): { direction: 'up' | 'down' | 'flat'; delta: string } {
  const curr = parseFloat(current)
  const prev = parseFloat(previous)
  if (prev === 0) return { direction: 'flat', delta: '0' }
  const pctChange = ((curr - prev) / Math.abs(prev)) * 100
  const direction = pctChange > 0.01 ? 'up' : pctChange < -0.01 ? 'down' : 'flat'
  return { direction, delta: pctChange.toFixed(1) }
}
