'use client'

import { useState } from 'react'
import { InlineBanner } from '@/components/inline-banner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fundName = process.env.NEXT_PUBLIC_FUND_NAME ?? 'Hudson Capital'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setState('loading')
    setErrorMsg(null)

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to send magic link')
      }

      setState('sent')
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-form">
        <h1 className="text-[24px] font-semibold text-text-primary">{fundName}</h1>
        <p className="mt-2 text-[15px] text-text-secondary">
          Sign in to your investor portal
        </p>

        {state === 'sent' ? (
          <div className="mt-6">
            <InlineBanner
              severity="success"
              message="Check your email for a sign-in link. It expires in 15 minutes."
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-text-secondary">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
              {state === 'loading' ? 'Sending...' : 'Send magic link'}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-[13px] text-text-muted">
          <a href="/admin/login" className="text-text-secondary hover:text-accent transition-colors duration-150">
            Admin login
          </a>
        </p>
      </div>
    </div>
  )
}
