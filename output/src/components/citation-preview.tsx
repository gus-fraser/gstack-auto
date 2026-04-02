'use client'

import { useState } from 'react'

interface CitationPreviewProps {
  documentName: string
  page: number | null
  excerpt: string
}

export function CitationPreview({ documentName, page, excerpt }: CitationPreviewProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-sm border border-border-subtle bg-surface-raised">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors duration-150 hover:bg-surface-raised"
        aria-expanded={expanded}
      >
        <span className="text-[12px] font-mono text-accent">
          [{documentName}{page !== null ? `, p.${page}` : ''}]
        </span>
      </button>
      {expanded && excerpt && (
        <div className="border-t border-border-subtle px-3 py-2">
          <p className="text-[12px] font-mono leading-[1.4] text-text-secondary">
            &ldquo;{excerpt}&rdquo;
          </p>
        </div>
      )}
    </div>
  )
}
