'use client'

import { useEffect, useState, useCallback } from 'react'
import { InlineBanner } from '@/components/inline-banner'
import { SkeletonTable } from '@/components/skeleton'
import { Mail, UserPlus } from 'lucide-react'

interface Lp {
  id: string
  lp_id: string | null
  lp_name: string | null
  email: string | null
  created_at: string
}

export function AdminLpsTab() {
  const [lps, setLps] = useState<Lp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchLps = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/lps')
      if (!res.ok) throw new Error('Failed to load LPs')
      const data = await res.json()
      setLps(data.lps)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load LPs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLps()
  }, [fetchLps])

  async function handleUpdateEmail(id: string) {
    if (!editEmail.trim()) return
    setActionMsg(null)

    try {
      const res = await fetch(`/api/admin/lps/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: editEmail.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to update email')
      }

      setEditingId(null)
      setEditEmail('')
      setActionMsg({ type: 'success', text: 'Email updated' })
      fetchLps()
    } catch (err) {
      setActionMsg({ type: 'error', text: err instanceof Error ? err.message : 'Update failed' })
    }
  }

  async function handleInvite(id: string) {
    setActionMsg(null)
    try {
      const res = await fetch(`/api/admin/lps/${id}/invite`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to send invite')
      }

      setActionMsg({ type: 'success', text: 'Invite sent' })
    } catch (err) {
      setActionMsg({ type: 'error', text: err instanceof Error ? err.message : 'Invite failed' })
    }
  }

  if (loading) {
    return <SkeletonTable rows={5} />
  }

  if (error) {
    return <InlineBanner severity="error" message={error} />
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[17px] font-medium text-text-primary">LP Management</h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          Assign email addresses and send portal invitations.
        </p>
      </div>

      {actionMsg && (
        <InlineBanner severity={actionMsg.type} message={actionMsg.text} />
      )}

      {lps.length === 0 ? (
        <div className="rounded-md border border-border bg-surface px-6 py-12 text-center">
          <UserPlus size={32} className="mx-auto text-text-muted" />
          <p className="mt-3 text-[15px] text-text-secondary">
            No LPs yet. Upload a CSV with LP data to create accounts.
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-surface">
          {lps.map((lp) => (
            <div
              key={lp.id}
              className="flex flex-col gap-2 border-b border-border px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-text-primary truncate">
                  {lp.lp_name ?? 'Unnamed LP'}
                </p>
                <p className="text-[12px] font-mono text-text-muted">{lp.lp_id}</p>
              </div>

              <div className="flex items-center gap-2">
                {editingId === lp.id ? (
                  <>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-48 rounded-md border border-border bg-background px-2 py-1.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateEmail(lp.id)}
                      className="rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setEditEmail('') }}
                      className="text-[13px] text-text-secondary hover:text-text-primary"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-[13px] text-text-secondary">
                      {lp.email ?? 'No email'}
                    </span>
                    <button
                      onClick={() => { setEditingId(lp.id); setEditEmail(lp.email ?? '') }}
                      className="text-[13px] text-accent hover:underline"
                    >
                      Edit
                    </button>
                    {lp.email && (
                      <button
                        onClick={() => handleInvite(lp.id)}
                        className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[13px] text-text-secondary hover:bg-surface-raised transition-colors duration-150"
                        title="Send portal invite"
                      >
                        <Mail size={14} />
                        Invite
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
