import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/db'
import { kpiData } from '@/db/schema'
import { sql, desc } from 'drizzle-orm'

export async function GET() {
  try {
    await requireAuth() // Any authenticated user can view fund overview

    // Aggregate all LP data by report period
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

    if (periods.length === 0) {
      return NextResponse.json({ latest: null, history: [] })
    }

    const latest = periods[0]!

    return NextResponse.json({
      latest: {
        report_date: latest.report_date,
        total_nav: latest.total_nav,
        total_distributions: latest.total_distributions,
        total_commitment: latest.total_commitment,
        total_called_capital: latest.total_called_capital,
        lp_count: latest.lp_count,
      },
      history: periods.map((p) => ({
        report_date: p.report_date,
        total_nav: p.total_nav,
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
    console.error('Fund route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
