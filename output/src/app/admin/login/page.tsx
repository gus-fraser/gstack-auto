'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { InlineBanner } from '@/components/inline-banner'

export default function AdminLoginPage() {
  const [secret, setSecret] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const router = useRouter()

  const fundName = process.env.NEXT_PUBLIC_FUND_NAME ?? 'Hudson Capital'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!secret.trim()) return

    setState('loading')
    setErrorMsg(null)

    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: secret.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Authentication failed')
      }

      router.push('/admin')
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-form">
        <h1 className="text-[24px] font-semibold text-text-primary">{fundName}</h1>
        <p className="mt-2 text-[15px] text-text-secondary">
          Admin access
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="secret" className="block text-[13px] font-medium text-text-secondary">
              Admin code
            </label>
            <input
              id="secret"
              type="password"
              autoComplete="off"
              required
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter admin code"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-150"
            />
          </div>

          {errorMsg && (
            <InlineBanner severity="error" message={errorMsg} />
          )}

          <button
            type="submit"
            disabled={state === 'loading'}
            className="w-full rounded-md bg-accent px-4 py-2.5 text-[15px] font-medium text-white transition-colors duration-150 hover:opacity-90 disabled:opacity-50"
          >
            {state === 'loading' ? 'Verifying...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-8 text-center text-[13px] text-text-muted">
          <a href="/login" className="text-text-secondary hover:text-accent transition-colors duration-150">
            LP login
          </a>
        </p>
      </div>
    </div>
  )
}
