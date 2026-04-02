'use client'

import { useEffect, useState } from 'react'
import { DataTable } from '@/components/data-table'
import { SkeletonTable } from '@/components/skeleton'
import { formatFileSize, formatDate } from '@/lib/format'
import { FileText, Download } from 'lucide-react'

interface Document {
  id: string
  filename: string
  file_type: string
  size_bytes: number
  uploaded_at: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const res = await fetch('/api/documents')
        if (!res.ok) throw new Error('Failed to load documents')
        const data = await res.json()
        setDocuments(data.documents)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load documents')
      } finally {
        setLoading(false)
      }
    }
    fetchDocuments()
  }, [])

  return (
    <div>
      <h1 className="text-[24px] font-semibold text-text-primary">Documents</h1>
      <p className="mt-1 text-[15px] text-text-secondary">
        Quarterly reports and fund documents
      </p>

      <div className="mt-6">
        {loading ? (
          <SkeletonTable rows={5} />
        ) : error ? (
          <div className="rounded-md border border-error-border bg-error-bg px-4 py-3">
            <p className="text-[15px] text-text-primary">{error}</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-md border border-border bg-surface px-6 py-12 text-center">
            <FileText size={32} className="mx-auto text-text-muted" />
            <p className="mt-3 text-[15px] text-text-secondary">
              No documents available yet.
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-border bg-surface">
            {documents.map((doc) => (
              <a
                key={doc.id}
                href={`/api/documents/${doc.id}`}
                className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0 transition-colors duration-150 hover:bg-surface-raised"
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-text-muted" />
                  <div>
                    <p className="text-[15px] text-text-primary">{doc.filename}</p>
                    <p className="text-[12px] font-mono text-text-muted">
                      {formatFileSize(doc.size_bytes)} &middot; {formatDate(doc.uploaded_at)}
                    </p>
                  </div>
                </div>
                <Download size={16} className="text-text-muted" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
