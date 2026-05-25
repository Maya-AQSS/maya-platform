import { useState, type ReactNode } from 'react'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

type Props = {
  /** URL de la foto. Si no se carga o no se aporta, muestra iniciales. */
  src?: string | null
  /** Iniciales (fallback). Generadas a partir del nombre completo si no se aportan. */
  initials?: string
  /** Nombre completo (alt + para auto-generar iniciales si `initials` está ausente). */
  name?: string
  size?: AvatarSize
  /** Cuando es interactivo (envuelto en button/link), añade ring en focus. */
  interactive?: boolean
  className?: string
  ariaHidden?: boolean
  /** Slot opcional para badge superpuesto (estado online, contador, etc.). */
  badge?: ReactNode
}

const sizePx: Record<AvatarSize, { wrap: string; text: string }> = {
  xs: { wrap: 'w-6 h-6 text-xs', text: '' },
  sm: { wrap: 'w-8 h-8 text-xs', text: '' },
  md: { wrap: 'w-10 h-10 text-sm', text: '' },
  lg: { wrap: 'w-12 h-12 text-base', text: '' },
  xl: { wrap: 'w-16 h-16 text-lg', text: '' },
}

function deriveInitials(name?: string): string {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

/**
 * Avatar circular reutilizable con fallback a iniciales y soporte de badge.
 * Si `src` falla al cargar, cae automáticamente al fallback.
 */
export function Avatar({
  src,
  initials,
  name,
  size = 'md',
  interactive = false,
  className = '',
  ariaHidden,
  badge,
}: Props) {
  const [errored, setErrored] = useState(false)
  const showImage = Boolean(src) && !errored
  const computedInitials = (initials ?? deriveInitials(name)).slice(0, 2).toUpperCase()
  const wrapSize = sizePx[size].wrap
  const interactiveCls = interactive
    ? 'focus-visible:ring-2 focus-visible:ring-odoo-purple/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ui-card dark:focus-visible:ring-offset-ui-dark-card'
    : ''
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-primary text-text-inverse font-semibold select-none ${wrapSize} ${interactiveCls} ${className}`.trim()}
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : name}
    >
      {showImage ? (
        <img
          src={src!}
          alt={name ?? ''}
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span aria-hidden>{computedInitials}</span>
      )}
      {badge ? (
        <span className="absolute -right-0.5 -bottom-0.5 inline-flex items-center justify-center">
          {badge}
        </span>
      ) : null}
    </span>
  )
}
