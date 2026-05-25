import type { ReactNode } from 'react'

type Props = {
  /** Etiqueta secundaria (ej: "Ventas totales"). */
  label: ReactNode
  /** Valor protagonista (ej: "95k", "82%"). Acepta string o ReactNode. */
  value: ReactNode
  /** Icono a la izquierda del label. */
  icon?: ReactNode
  /** Variación porcentual respecto a un periodo anterior (positiva o negativa). */
  deltaPct?: number
  /** Texto del periodo de comparación (ej: "vs mes anterior"). */
  deltaPeriod?: string
  /** Cuando true, aplica el gradiente al número. Default true. */
  gradient?: boolean
  /** Tamaño visual del valor. */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const valueSize: Record<NonNullable<Props['size']>, string> = {
  sm: 'text-2xl',
  md: 'text-3xl sm:text-4xl',
  lg: 'text-4xl sm:text-5xl',
}

/**
 * Tarjeta de métrica con número grande (gradiente opcional) + delta.
 * Pensada para dashboards estilo Tulsar/Beluga.
 *
 *   <StatCard label="Emails" value="95k" deltaPct={12} deltaPeriod="vs sem anterior" />
 */
export function StatCard({
  label,
  value,
  icon,
  deltaPct,
  deltaPeriod,
  gradient = true,
  size = 'md',
  className = '',
}: Props) {
  const hasDelta = typeof deltaPct === 'number' && Number.isFinite(deltaPct)
  const positive = hasDelta && (deltaPct as number) > 0
  const negative = hasDelta && (deltaPct as number) < 0
  return (
    <div
      className={[
        'rounded-2xl border border-ui-border-l dark:border-ui-dark-border-l',
        'bg-card-tinted shadow-card',
        'px-5 py-4 flex flex-col gap-1',
        className,
      ].join(' ').trim()}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-text-secondary dark:text-text-dark-secondary uppercase tracking-wider">
        {icon ? <span aria-hidden className="shrink-0">{icon}</span> : null}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={[
          'font-display font-extrabold tracking-tight leading-none',
          valueSize[size],
          gradient
            ? 'text-gradient-primary'
            : 'text-text-primary dark:text-text-dark-primary',
        ].join(' ').trim()}
      >
        {value}
      </div>
      {hasDelta ? (
        <div
          className={[
            'mt-1 inline-flex items-center gap-1.5 text-xs font-semibold',
            positive ? 'text-success-dark dark:text-success' : '',
            negative ? 'text-danger-dark dark:text-danger' : '',
            !positive && !negative ? 'text-text-secondary dark:text-text-dark-secondary' : '',
          ].join(' ').trim()}
        >
          <span aria-hidden>{positive ? '▲' : negative ? '▼' : '–'}</span>
          <span>{Math.abs(deltaPct as number).toFixed(1)}%</span>
          {deltaPeriod ? (
            <span className="font-normal text-text-muted dark:text-text-dark-muted">
              {deltaPeriod}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
