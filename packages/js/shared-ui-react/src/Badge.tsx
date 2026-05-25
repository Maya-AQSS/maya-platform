import type { ReactNode } from 'react'

export type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info'
export type BadgeSize = 'sm' | 'md'

type Props = {
  /** Texto del badge. Cuando se necesita marcado custom, usar `children`. */
  label?: ReactNode
  children?: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
}

const variantClass: Record<BadgeVariant, string> = {
  default:
    'bg-odoo-purple/10 dark:bg-odoo-dark-purple/20 text-odoo-purple dark:text-odoo-dark-purple border-odoo-purple/30 dark:border-odoo-dark-purple/40',
  success: 'bg-success-light text-success-dark border-success/30',
  danger: 'bg-danger-light text-danger-dark border-danger/30',
  warning: 'bg-warning-light text-warning-dark border-warning/30',
  info: 'bg-info-light text-info-dark border-info/30',
}

const sizeClass: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
}

export function Badge({
  label,
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: Props) {
  return (
    <span
      className={`inline-block border rounded-full font-semibold ${sizeClass[size]} ${variantClass[variant]} ${className}`}
    >
      {label ?? children}
    </span>
  )
}
