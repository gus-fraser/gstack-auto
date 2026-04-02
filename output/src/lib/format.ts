// ─── Currency Formatting ────────────────────────────────────────────

export function formatCurrency(value: string | number, compact = false): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return String(value)

  if (compact) {
    if (Math.abs(num) >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`
    if (Math.abs(num) >= 1_000) return `$${(num / 1_000).toFixed(0)}K`
    return `$${num.toFixed(2)}`
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

// ─── Percent Formatting ─────────────────────────────────────────────

export function formatPercent(value: string | number, decimals = 1): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return String(value)
  return `${(num * 100).toFixed(decimals)}%`
}

// ─── Multiple Formatting ────────────────────────────────────────────

export function formatMultiple(value: string | number, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return String(value)
  return `${num.toFixed(decimals)}x`
}

// ─── File Size Formatting ───────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Date Formatting ────────────────────────────────────────────────

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
