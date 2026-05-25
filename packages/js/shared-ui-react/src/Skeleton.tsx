import type { HTMLAttributes } from 'react'

type DivProps = HTMLAttributes<HTMLDivElement>

const SHIMMER_BASE =
  'animate-pulse bg-ui-border-l dark:bg-ui-dark-border rounded'

/**
 * Bloque rectangular genérico. Usa `width`/`height` por className o style.
 * Respeta `prefers-reduced-motion` (vía CSS global) — la pulsación se reduce a estado estático.
 */
export function Skeleton({ className = '', ...rest }: DivProps) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={`${SHIMMER_BASE} ${className}`.trim()}
      {...rest}
    />
  )
}

/** Línea de texto (alto fijo, ancho controlable por `className` con `w-*`). */
export function SkeletonLine({ className = '', ...rest }: DivProps) {
  return <Skeleton className={`h-3 ${className}`} {...rest} />
}

/** Avatar circular (default 40px). */
export function SkeletonAvatar({ className = '', ...rest }: DivProps) {
  return <Skeleton className={`size-10 rounded-full ${className}`} {...rest} />
}

/** Bloque rectangular para tarjetas de contenido (default h-32). */
export function SkeletonBlock({ className = '', ...rest }: DivProps) {
  return <Skeleton className={`h-32 rounded-lg ${className}`} {...rest} />
}

type SkeletonRowsProps = DivProps & {
  /** Número de líneas a renderizar (default 3). */
  count?: number
  /** Clase aplicada a cada línea — útil para anchos progresivos. */
  lineClassName?: string
}

/**
 * Lista vertical de líneas de texto, p. ej. para reemplazar párrafos durante carga.
 *
 *   <SkeletonRows count={4} />
 */
export function SkeletonRows({ count = 3, lineClassName = '', className = '', ...rest }: SkeletonRowsProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()} {...rest}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonLine
          key={i}
          className={i === count - 1 ? `w-3/5 ${lineClassName}` : `w-full ${lineClassName}`}
        />
      ))}
    </div>
  )
}

/**
 * Esqueleto típico para una página: encabezado + 3 bloques de contenido.
 * Útil como `<Suspense fallback={<SkeletonPage />}>`.
 */
export function SkeletonPage({ className = '', ...rest }: DivProps) {
  return (
    <div
      className={`min-h-screen bg-ui-body dark:bg-ui-dark-bg flex items-start justify-center pt-20 ${className}`.trim()}
      {...rest}
    >
      <div className="w-full max-w-2xl px-8 flex flex-col gap-4">
        <Skeleton className="h-6 w-48" />
        <SkeletonLine className="w-full" />
        <SkeletonLine className="w-3/4" />
        <SkeletonBlock className="mt-4 rounded-2xl" />
      </div>
    </div>
  )
}
