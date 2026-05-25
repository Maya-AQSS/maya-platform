import type { ReactNode } from 'react'

export type AlertTone = 'danger' | 'warning' | 'info' | 'success'

type Props = {
  tone?: AlertTone
  title?: ReactNode
  children: ReactNode
  icon?: ReactNode
  className?: string
  /** Se anuncia con role="alert" + aria-live="assertive" cuando tone="danger". */
  live?: boolean
}

const toneClass: Record<AlertTone, string> = {
  danger:
    'border-danger-light bg-danger-light/30 text-danger-dark dark:border-danger/40 dark:bg-danger/10 dark:text-danger',
  warning:
    'border-warning/40 bg-warning-light/40 text-warning-dark dark:border-warning/30 dark:bg-warning-dark/15 dark:text-warning',
  info:
    'border-odoo-purple/30 bg-odoo-purple/5 text-text-primary dark:border-odoo-dark-purple/40 dark:bg-odoo-dark-purple/10 dark:text-text-dark-primary',
  success:
    'border-odoo-teal/40 bg-odoo-teal/5 text-text-primary dark:border-odoo-teal/30 dark:bg-odoo-teal/10 dark:text-text-dark-primary',
}

const defaultIcon: Record<AlertTone, string> = {
  danger: '⚠️',
  warning: '⚠️',
  info: 'ℹ️',
  success: '✅',
}

export function Alert({ tone = 'info', title, children, icon, className = '', live }: Props) {
  const isLive = live ?? tone === 'danger'
  const computedIcon = icon ?? defaultIcon[tone]
  return (
    <div
      role={isLive ? 'alert' : 'status'}
      aria-live={isLive ? 'assertive' : 'polite'}
      className={`flex gap-3 rounded-lg border px-3 py-2.5 text-sm ${toneClass[tone]} ${className}`}
    >
      {computedIcon ? <span aria-hidden className="shrink-0 text-base leading-none mt-0.5">{computedIcon}</span> : null}
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold leading-tight mb-0.5">{title}</p> : null}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  )
}
