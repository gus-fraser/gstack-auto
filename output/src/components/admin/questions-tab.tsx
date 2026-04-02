'use client'

import { useEffect, useState } from 'react'
import { SkeletonTable } from '@/components/skeleton'
import { InlineBanner } from '@/components/inline-banner'
import { MessageSquare } from 'lucide-react'

interface Question {
  id: number
  content: string
  created_at: string
}

export function AdminQuestionsTab() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch('/api/admin/questions')
        if (!res.ok) throw new Error('Failed to load questions')
        const data = await res.json()
        setQuestions(data.questions)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions')
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [])

  if (loading) return <SkeletonTable rows={5} />
  if (error) return <InlineBanner severity="error" message={error} />

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[17px] font-medium text-text-primary">Question Log</h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          Recent questions from LP users. Use these to identify knowledge gaps.
        </p>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-md border border-border bg-surface px-6 py-12 text-center">
          <MessageSquare size={32} className="mx-auto text-text-muted" />
          <p className="mt-3 text-[15px] text-text-secondary">
            No questions asked yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => (
            <div
              key={q.id}
              className="rounded-md border border-border bg-surface px-4 py-3"
            >
              <p className="text-[15px] text-text-primary">{q.content}</p>
              <p className="mt-1 text-[12px] font-mono text-text-muted">
                {new Date(q.created_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
