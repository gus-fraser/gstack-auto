export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const fundName = process.env.FUND_NAME ?? 'Hudson Capital'

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-admin-content items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <span className="text-[17px] font-medium text-text-primary">{fundName}</span>
            <span className="rounded-sm bg-surface-raised px-2 py-0.5 text-[12px] font-mono text-text-muted">
              Admin
            </span>
          </div>
          <a
            href="/api/auth/logout"
            className="text-[13px] text-text-secondary hover:text-negative transition-colors duration-150"
          >
            Sign out
          </a>
        </div>
      </header>
      <div className="mx-auto max-w-admin-content px-4 py-6 md:px-6 md:py-8">
        {children}
      </div>
    </div>
  )
}
