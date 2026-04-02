'use client'

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface Column<T> {
  key: keyof T & string
  header: string
  align?: 'left' | 'right'
  format?: (value: T[keyof T]) => string
  sortable?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = 'No data available.',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const sortedData = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortKey, sortDirection])

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-[15px] text-text-secondary">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2 text-[13px] font-medium uppercase tracking-wider text-text-secondary ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                } ${col.sortable !== false ? 'cursor-pointer select-none' : ''}`}
                onClick={() => col.sortable !== false && handleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {sortKey === col.key && (
                    sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, i) => (
            <tr
              key={i}
              className={`transition-colors duration-150 hover:bg-surface-raised ${
                i % 2 === 0 ? 'bg-surface' : 'bg-surface-raised'
              }`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-2.5 text-[15px] ${
                    col.align === 'right'
                      ? 'text-right font-mono'
                      : 'text-left'
                  } text-text-primary`}
                >
                  {col.format ? col.format(row[col.key]) : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
