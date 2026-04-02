'use client'

import { useEffect, useState } from 'react'
import { KpiCard, KpiCardSkeleton } from '@/components/kpi-card'
import { NavChart, NavChartSkeleton } from '@/components/nav-chart'

interface Trend {
  direction: 'up' | 'down' | 'flat'
  delta: string
}

interface KpiResponse {
  latest: {
    report_date: string
    lp_name: string
    commitment: string
    called_capital: string
    nav: string
    distributions_to_date: string
    irr: string
    tvpi: string
  } | null
  trends: Record<string, Trend> | null
  history: Array<{ report_date: string; nav: string }>
}

interface FundResponse {
  latest: {
    report_date: string
    total_nav: string
    total_distributions: string
    total_commitment: string
    total_called_capital: string
    lp_count: number
  } | null
  history: Array<{ report_date: string; total_nav: string }>
}

export default function DashboardPage() {
  const [kpi, setKpi] = useState<KpiResponse | null>(null)
  const [fund, setFund] = useState<FundResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [kpiRes, fundRes] = await Promise.all([
          fetch('/api/kpi'),
          fetch('/api/fund'),
        ])

        if (!kpiRes.ok) throw new Error('Failed to load your data')
        if (!fundRes.ok) throw new Error('Failed to load fund data')

        const kpiData: KpiResponse = await kpiRes.json()
        const fundData: FundResponse = await fundRes.json()

        setKpi(kpiData)
        setFund(fundData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (error) {
    return (
      <div className="rounded-md border border-error-border bg-error-bg px-4 py-3">
        <p className="text-[15px] text-text-primary">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-[24px] font-semibold text-text-primary">Dashboard</h1>
      {kpi?.latest && (
        <p className="mt-1 text-[15px] text-text-secondary">
          Welcome back, {kpi.latest.lp_name}
        </p>
      )}

      {/* Personal KPIs */}
      <section className="mt-6" aria-label="Your capital account">
        <h2 className="text-[17px] font-medium text-text-primary">Your Capital Account</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <>
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
            </>
          ) : kpi?.latest ? (
            <>
              <KpiCard
                label="NAV"
                value={kpi.latest.nav}
                format="currency"
                trend={kpi.trends?.nav}
                period={kpi.latest.report_date}
              />
              <KpiCard
                label="Commitment"
                value={kpi.latest.commitment}
                format="currency"
                trend={kpi.trends?.commitment}
              />
              <KpiCard
                label="Called Capital"
                value={kpi.latest.called_capital}
                format="currency"
                trend={kpi.trends?.called_capital}
              />
              <KpiCard
                label="Distributions"
                value={kpi.latest.distributions_to_date}
                format="currency"
                trend={kpi.trends?.distributions}
              />
              <KpiCard
                label="IRR"
                value={kpi.latest.irr}
                format="percent"
                trend={kpi.trends?.irr}
              />
              <KpiCard
                label="TVPI"
                value={kpi.latest.tvpi}
                format="multiple"
                trend={kpi.trends?.tvpi}
              />
            </>
          ) : (
            <p className="col-span-full py-8 text-center text-[15px] text-text-secondary">
              No data available yet. Your fund manager will upload your data soon.
            </p>
          )}
        </div>
      </section>

      {/* NAV Chart */}
      <section className="mt-8" aria-label="NAV history">
        {loading ? (
          <NavChartSkeleton />
        ) : kpi?.history && kpi.history.length >= 2 ? (
          <NavChart data={kpi.history} title="Your NAV Over Time" />
        ) : null}
      </section>

      {/* Fund Overview */}
      <section className="mt-8" aria-label="Fund overview">
        <h2 className="text-[17px] font-medium text-text-primary">Fund Overview</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <KpiCardSkeleton variant="secondary" />
              <KpiCardSkeleton variant="secondary" />
              <KpiCardSkeleton variant="secondary" />
              <KpiCardSkeleton variant="secondary" />
            </>
          ) : fund?.latest ? (
            <>
              <KpiCard
                label="Fund NAV"
                value={fund.latest.total_nav}
                format="currency"
                variant="secondary"
              />
              <KpiCard
                label="Total Commitment"
                value={fund.latest.total_commitment}
                format="currency"
                variant="secondary"
              />
              <KpiCard
                label="Total Called"
                value={fund.latest.total_called_capital}
                format="currency"
                variant="secondary"
              />
              <KpiCard
                label="Total Distributions"
                value={fund.latest.total_distributions}
                format="currency"
                variant="secondary"
              />
            </>
          ) : null}
        </div>
      </section>
    </div>
  )
}
