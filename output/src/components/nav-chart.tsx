'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  report_date: string
  nav: string
}

interface NavChartProps {
  data: DataPoint[]
  title?: string
}

export function NavChart({ data, title = 'NAV Over Time' }: NavChartProps) {
  if (data.length < 2) {
    return (
      <div className="rounded-md border border-border bg-surface p-6">
        <h3 className="text-[17px] font-medium text-text-primary">{title}</h3>
        <p className="mt-4 text-center text-[15px] text-text-secondary">
          Chart requires at least two reporting periods.
        </p>
      </div>
    )
  }

  const chartData = [...data].reverse().map((d) => ({
    date: d.report_date,
    nav: parseFloat(d.nav),
  }))

  return (
    <div className="rounded-md border border-border bg-surface p-6">
      <h3 className="mb-4 text-[17px] font-medium text-text-primary">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid
            horizontal={true}
            vertical={false}
            strokeDasharray="4 4"
            stroke="var(--border)"
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fontFamily: 'var(--font-jetbrains)', fill: 'var(--text-muted)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fontFamily: 'var(--font-jetbrains)', fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'var(--text-muted)', strokeDasharray: '4 4' }}
          />
          <Line
            type="monotone"
            dataKey="nav"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--accent)', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: 'var(--accent)', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <p className="text-[12px] font-mono text-text-muted">{label}</p>
      <p className="text-[15px] font-mono font-medium text-text-primary">
        {formatCurrencyFull(payload[0]!.value)}
      </p>
    </div>
  )
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function NavChartSkeleton() {
  return (
    <div className="rounded-md border border-border bg-surface p-6">
      <div className="h-5 w-32 animate-pulse rounded bg-surface-raised" />
      <div className="mt-4 h-[280px] animate-pulse rounded bg-surface-raised" />
    </div>
  )
}
