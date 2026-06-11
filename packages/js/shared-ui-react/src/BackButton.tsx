import { useTranslation } from 'react-i18next'
import { Button } from './Button'

export type BackButtonVariant =
  /** Flecha redonda de 40 px (la del encabezado `PageTitle`). Sin texto visible. */
  | 'icon'
  /** Flecha + texto con borde neutro: footers, estados de error/not-found. */
  | 'outline'
  /** Flecha + texto sin borde: toolbars y contextos densos. */
  | 'ghost'

export interface BackButtonProps {
  /** Navegación a ejecutar (típicamente el `goBack` de `useBackNavigation`). */
  onClick: () => void
  /** Texto del botón y `aria-label`. Si no se pasa, usa i18n `actions.back`. */
  label?: string
  variant?: BackButtonVariant
  className?: string
  disabled?: boolean
}

export function BackArrowIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

/**
 * Botón "Volver" canónico del ecosistema Maya. La lógica de navegación es del
 * consumidor (componer con `useBackNavigation` de shared-hooks-react):
 *
 *   const { goBack } = useBackNavigation({ fallback: '/themes' })
 *   <BackButton onClick={() => goBack()} />
 */
export function BackButton({
  onClick,
  label,
  variant = 'icon',
  className = '',
  disabled,
}: BackButtonProps) {
  const { t } = useTranslation('common')
  const resolvedLabel = label ?? t('actions.back', { defaultValue: 'Volver' })

  if (variant === 'icon') {
    const base =
      'inline-flex items-center justify-center w-10 h-10 rounded-full text-text-secondary dark:text-text-dark-secondary hover:bg-text-primary/5 dark:hover:bg-text-inverse/8 hover:text-odoo-purple dark:hover:text-odoo-dark-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-odoo-purple/35 transition-colors disabled:pointer-events-none disabled:opacity-60'
    return (
      <button
        type="button"
        onClick={() => onClick()}
        disabled={disabled}
        aria-label={resolvedLabel}
        title={resolvedLabel}
        className={`${base} ${className}`.trim()}
      >
        <BackArrowIcon />
      </button>
    )
  }

  return (
    <Button variant={variant} onClick={() => onClick()} disabled={disabled} className={className}>
      <BackArrowIcon size={16} />
      {resolvedLabel}
    </Button>
  )
}
