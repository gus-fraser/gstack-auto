'use client'

import { useState, useRef, useCallback } from 'react'

type UploadState = 'idle' | 'hover' | 'drag-valid' | 'drag-invalid' | 'uploading' | 'success' | 'error'

interface UploadResult {
  type: 'csv' | 'pdf'
  filename: string
  rows?: number
  lps_found?: number
  lps_created?: number
  chunks?: number
}

interface FileUploadProps {
  onUploadComplete?: (result: UploadResult) => void
  onUploadError?: (error: string) => void
}

const ACCEPTED_TYPES = ['application/pdf', 'text/csv']
const ACCEPTED_EXTENSIONS = ['.pdf', '.csv']

export function FileUpload({ onUploadComplete, onUploadError }: FileUploadProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isValidFile = useCallback((file: File): boolean => {
    const name = file.name.toLowerCase()
    return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext)) || ACCEPTED_TYPES.includes(file.type)
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.items[0]
      if (file) {
        setState(
          ACCEPTED_TYPES.includes(file.type) ? 'drag-valid' : 'drag-invalid'
        )
      }
    },
    []
  )

  const handleDragLeave = useCallback(() => {
    setState('idle')
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file && isValidFile(file)) {
        setSelectedFile(file)
        setState('idle')
      } else {
        setState('idle')
        setErrorMsg('Only PDF and CSV files are accepted.')
      }
    },
    [isValidFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && isValidFile(file)) {
        setSelectedFile(file)
        setErrorMsg(null)
      } else if (file) {
        setErrorMsg('Only PDF and CSV files are accepted.')
      }
    },
    [isValidFile]
  )

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return

    setState('uploading')
    setErrorMsg(null)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      setProgress(100)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? 'Upload failed')
      }

      const data: UploadResult = await response.json()
      setResult(data)
      setState('success')
      onUploadComplete?.(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setErrorMsg(msg)
      setState('error')
      onUploadError?.(msg)
    }
  }, [selectedFile, onUploadComplete, onUploadError])

  const handleReset = useCallback(() => {
    setSelectedFile(null)
    setResult(null)
    setErrorMsg(null)
    setProgress(0)
    setState('idle')
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-md border-2 border-dashed p-8 text-center transition-colors duration-150 ${
          state === 'drag-valid'
            ? 'border-accent bg-accent-subtle'
            : state === 'drag-invalid'
            ? 'border-negative bg-error-bg'
            : 'border-border bg-surface-raised hover:bg-surface'
        }`}
        role="button"
        tabIndex={0}
        aria-label="Upload file"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        <p className="text-[15px] text-text-primary">Drop PDF or CSV here</p>
        <p className="mt-1 text-[13px] text-text-secondary">or click to browse</p>
        <p className="mt-3 text-[12px] font-mono text-text-muted">
          Accepted: PDF (10MB), CSV (5MB)
        </p>
      </div>

      {/* Selected file */}
      {selectedFile && state !== 'success' && (
        <div className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3">
          <div>
            <p className="text-[15px] text-text-primary">{selectedFile.name}</p>
            <p className="text-[12px] font-mono text-text-muted">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="text-[13px] text-text-secondary hover:text-negative transition-colors duration-150"
            >
              Remove
            </button>
            <button
              onClick={handleUpload}
              disabled={state === 'uploading'}
              className="rounded-md bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors duration-150 hover:opacity-90 disabled:opacity-50"
            >
              {state === 'uploading' ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {state === 'uploading' && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-raised">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Success message */}
      {state === 'success' && result && (
        <div className="rounded-md border border-border bg-success-bg px-4 py-3">
          <p className="text-[15px] text-text-primary">
            Uploaded. {result.type === 'csv' ? (
              <>{result.lps_found} LPs found. {result.rows} records imported.</>
            ) : (
              <>{result.chunks} chunks indexed.</>
            )}
          </p>
          <button onClick={handleReset} className="mt-2 text-[13px] text-accent hover:underline">
            Upload another file
          </button>
        </div>
      )}

      {/* Error message */}
      {errorMsg && state !== 'success' && (
        <p className="text-[13px] text-negative">{errorMsg}</p>
      )}
    </div>
  )
}
