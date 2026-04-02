'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying')

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      // The /api/auth/verify route handles the redirect
      window.location.href = `/api/auth/verify?token=${token}`
    } else {
      setStatus('error')
    }
  }, [searchParams])

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-form text-center">
          <h1 className="text-[24px] font-semibold text-text-primary">Invalid Link</h1>
          <p className="mt-2 text-[15px] text-text-secondary">
            This magic link is missing or has expired.
          </p>
          <a
            href="/login"
            className="mt-4 inline-block rounded-md bg-accent px-4 py-2.5 text-[15px] font-medium text-white"
          >
            Request a new link
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <p className="text-[15px] text-text-secondary">Verifying your link...</p>
      </div>
    </div>
  )
}
