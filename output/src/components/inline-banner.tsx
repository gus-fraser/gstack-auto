interface InlineBannerProps {
  severity: 'error' | 'warning' | 'success' | 'info'
  message: string
  dismissible?: boolean
  onDismiss?: () => void
}

const severityStyles = {
  error: 'bg-error-bg border-l-negative',
  warning: 'bg-warning-bg border-l-warning',
  success: 'bg-success-bg border-l-positive',
  info: 'bg-surface-raised border-l-accent',
}

export function InlineBanner({ severity, message, dismissible, onDismiss }: InlineBannerProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-md border border-border border-l-[3px] px-4 py-3 ${severityStyles[severity]}`}
      role="alert"
    >
      <p className="text-[15px] text-text-primary">{message}</p>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 text-[13px] text-text-secondary hover:text-text-primary transition-colors duration-150"
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      )}
    </div>
  )
}
