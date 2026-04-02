import { describe, it, expect } from 'vitest'
import { formatCurrency, formatPercent, formatMultiple, formatFileSize, formatDate } from '../format'

describe('formatCurrency', () => {
  it('formats millions with M suffix in compact mode', () => {
    expect(formatCurrency(5000000, true)).toBe('$5.00M')
    expect(formatCurrency('2500000', true)).toBe('$2.50M')
  })

  it('formats thousands with K suffix in compact mode', () => {
    expect(formatCurrency(50000, true)).toBe('$50K')
    expect(formatCurrency('1500', true)).toBe('$2K')
  })

  it('formats small values with 2 decimal places in compact mode', () => {
    expect(formatCurrency(42.5, true)).toBe('$42.50')
  })

  it('formats with full Intl formatting in non-compact mode', () => {
    const result = formatCurrency(1234567.89)
    expect(result).toContain('1,234,567.89')
  })

  it('handles string input', () => {
    expect(formatCurrency('5000000', true)).toBe('$5.00M')
  })

  it('returns original value for non-numeric strings', () => {
    expect(formatCurrency('N/A')).toBe('N/A')
  })
})

describe('formatPercent', () => {
  it('converts decimal to percentage', () => {
    expect(formatPercent(0.125)).toBe('12.5%')
    expect(formatPercent('0.08')).toBe('8.0%')
  })

  it('handles custom decimal places', () => {
    expect(formatPercent(0.1234, 2)).toBe('12.34%')
  })

  it('returns original value for non-numeric', () => {
    expect(formatPercent('N/A')).toBe('N/A')
  })
})

describe('formatMultiple', () => {
  it('formats as multiple with x suffix', () => {
    expect(formatMultiple(1.25)).toBe('1.25x')
    expect(formatMultiple('2.1')).toBe('2.10x')
  })

  it('handles custom decimal places', () => {
    expect(formatMultiple(1.5, 1)).toBe('1.5x')
  })
})

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B')
  })

  it('formats kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB')
  })

  it('formats megabytes', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB')
  })
})

describe('formatDate', () => {
  it('formats date string', () => {
    const result = formatDate('2024-12-15T00:00:00.000Z')
    expect(result).toContain('Dec')
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })

  it('formats Date object', () => {
    const result = formatDate(new Date('2024-06-01'))
    expect(result).toContain('2024')
  })
})
