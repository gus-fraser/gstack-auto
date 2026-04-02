'use client'

import { CitationPreview } from './citation-preview'

interface Citation {
  index: number
  documentName: string
  pageNumber: number | null
  excerpt: string
}

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  confidence?: number
  isStreaming?: boolean
}

export function ChatMessage({ role, content, citations, confidence, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user'
  const isLowConfidence = confidence !== undefined && confidence >= 0.7 && confidence < 0.75

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-md px-4 py-3 ${
          isUser
            ? 'bg-accent-subtle text-text-primary'
            : `bg-surface border border-border text-text-primary ${
                isLowConfidence ? 'border-l-[3px] border-l-warning' : ''
              }`
        }`}
      >
        {isLowConfidence && !isUser && (
          <p className="mb-2 text-[12px] font-mono text-warning">
            Low confidence answer -- verify with your fund manager.
          </p>
        )}
        <div className="whitespace-pre-wrap text-[15px] leading-[1.5]">
          {content}
          {isStreaming && <span className="inline-block w-2 animate-pulse">|</span>}
        </div>
        {citations && citations.length > 0 && (
          <div className="mt-3 space-y-2">
            {citations.map((citation) => (
              <CitationPreview
                key={citation.index}
                documentName={citation.documentName}
                page={citation.pageNumber}
                excerpt={citation.excerpt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
