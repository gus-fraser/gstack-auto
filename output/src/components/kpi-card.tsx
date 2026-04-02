'use client'

import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface Trend {
  direction: 'up' | 'down' | 'flat'
  delta: string
}

interface KpiCardProps {
  label: string
  value: string
  format: 'currency' | 'percent' | 'multiple'
  trend?: Trend | null
  variant?: 'primary' | 'secondary'
  period?: string
}

export function KpiCard({ label, value, format, trend, variant = 'primary', period }: KpiCardProps) {
  const formattedValue = formatValue(value, format)

  return (
    <div
      className={`rounded-md border border-border p-6 ${
        variant === 'primary' ? 'bg-surface' : 'bg-surface-raised'
      }`}
      aria-label={`${label}: ${formattedValue}${trend ? `, ${trend.direction} ${trend.delta}% from prior period` : ''}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={`font-mono font-medium text-text-primary ${
            variant === 'primary' ? 'text-[28px] leading-[1.2]' : 'text-[22px] leading-[1.2]'
          }`}
        >
          {formattedValue}
        </span>
        {trend && trend.direction !== 'flat' && (
          <span
            className={`flex items-center gap-0.5 text-[13px] font-mono ${
              trend.direction === 'up' ? 'text-positive' : 'text-negative'
            }`}
          >
            {trend.direction === 'up' ? (
              <ArrowUp size={16} />
            ) : (
              <ArrowDown size={16} />
            )}
            {Math.abs(parseFloat(trend.delta)).toFixed(1)}%
          </span>
        )}
        {trend && trend.direction === 'flat' && (
          <span className="flex items-center gap-0.5 text-[13px] font-mono text-text-muted">
            <Minus size={16} />
          </span>
        )}
      </div>
      <p className="mt-1 text-[13px] text-text-secondary">{label}</p>
      {period && (
        <p className="mt-0.5 text-[12px] font-mono text-text-muted">As of {period}</p>
      )}
    </div>
  )
}

function formatValue(value: string, format: 'currency' | 'percent' | 'multiple'): string {
  const num = parseFloat(value)
  if (isNaN(num)) return value

  switch (format) {
    case 'currency':
      if (Math.abs(num) >= 1_000_000) {
        return `$${(num / 1_000_000).toFixed(2)}M`
      }
      if (Math.abs(num) >= 1_000) {
        return `$${(num / 1_000).toFixed(0)}K`
      }
      return `$${num.toFixed(2)}`
    case 'percent':
      return `${(num * 100).toFixed(1)}%`
    case 'multiple':
      return `${num.toFixed(2)}x`
  }
}

// ─── Skeleton ────────────────────────────────────────────

export function KpiCardSkeleton({ variant = 'primary' }: { variant?: 'primary' | 'secondary' }) {
  return (
    <div
      className={`rounded-md border border-border p-6 ${
        variant === 'primary' ? 'bg-surface' : 'bg-surface-raised'
      }`}
    >
      <div className="h-8 w-32 animate-pulse rounded bg-surface-raised" />
      <div className="mt-2 h-4 w-20 animate-pulse rounded bg-surface-raised" />
      <div className="mt-1 h-3 w-16 animate-pulse rounded bg-surface-raised" />
    </div>
  )
}
