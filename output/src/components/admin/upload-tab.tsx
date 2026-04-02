'use client'

import { FileUpload } from '@/components/file-upload'
import { useState } from 'react'
import { InlineBanner } from '@/components/inline-banner'

export function AdminUploadTab() {
  const [lastResult, setLastResult] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[17px] font-medium text-text-primary">Upload Data</h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          Upload CSV files with LP KPI data or PDF quarterly reports.
        </p>
      </div>

      <FileUpload
        onUploadComplete={(result) => {
          if (result.type === 'csv') {
            setLastResult(
              `CSV imported: ${result.rows} rows, ${result.lps_found} LPs found, ${result.lps_created} new LPs created.`
            )
          } else {
            setLastResult(`PDF processed: ${result.chunks} chunks indexed.`)
          }
        }}
        onUploadError={(error) => {
          setLastResult(null)
        }}
      />

      {lastResult && (
        <InlineBanner severity="success" message={lastResult} />
      )}

      <div className="rounded-md border border-border bg-surface-raised px-4 py-3">
        <h3 className="text-[15px] font-medium text-text-primary">CSV Format</h3>
        <p className="mt-1 text-[13px] text-text-secondary">
          Required columns: report_date, lp_id, lp_name, commitment, called_capital, nav, distributions_to_date, irr, tvpi
        </p>
        <p className="mt-1 text-[13px] text-text-secondary">
          Optional columns: lp_email (auto-creates LP user accounts)
        </p>
        <code className="mt-2 block overflow-x-auto whitespace-pre rounded bg-background px-3 py-2 text-[12px] font-mono text-text-secondary">
          report_date,lp_id,lp_name,commitment,called_capital,nav,distributions_to_date,irr,tvpi,lp_email{'\n'}
          2024-Q4,LP001,Acme Pension,5000000,4000000,4500000,500000,0.12,1.25,contact@acme.com
        </code>
      </div>
    </div>
  )
}
