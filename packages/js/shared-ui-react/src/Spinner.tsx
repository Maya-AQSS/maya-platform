import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg'
export type SpinnerTone = 'primary' | 'inverse' | 'muted'

type Props = {
  size?: SpinnerSize
  tone?: SpinnerTone
  /** Texto descriptivo para lectores de pantalla. Si no se pasa, usa i18n. */
  label?: string
  className?: string
  style?: CSSProperties
}

const sizeClass: Record<SpinnerSize, string> = {
  xs: 'size-3 border-2',
  sm: 'size-4 border-2',
  md: 'size-6 border-2',
  lg: 'size-10 border-[3px]',
}

const toneClass: Record<SpinnerTone, string> = {
  primary: 'border-odoo-purple/25 border-t-odoo-purple dark:border-odoo-dark-purple/25 dark:border-t-odoo-dark-purple',
  inverse: 'border-text-inverse/30 border-t-text-inverse',
  muted: 'border-text-muted/30 border-t-text-muted dark:border-text-dark-muted/30 dark:border-t-text-dark-muted',
}

/**
 * Indicador de carga circular. Respeta `prefers-reduced-motion` (vía CSS global).
 *
 * Para overlays a pantalla completa o sobre tarjetas, envuelve en un contenedor
 * con `flex items-center justify-center` y aplica el color de fondo/backdrop deseado.
 */
export function Spinner({
  size = 'md',
  tone = 'primary',
  label,
  className = '',
  style,
}: Props) {
  const { t } = useTranslation('common')
  const resolvedLabel = label ?? t('status.loading', { defaultValue: 'Loading…' })
  const base = 'shrink-0 animate-spin rounded-full'
  const merged = `${base} ${sizeClass[size]} ${toneClass[tone]} ${className}`.trim()

  return (
    <span role="status" aria-live="polite" aria-label={resolvedLabel} className="inline-flex items-center" style={style}>
      <span className={merged} aria-hidden="true" />
      <span className="sr-only">{resolvedLabel}</span>
    </span>
  )
}
