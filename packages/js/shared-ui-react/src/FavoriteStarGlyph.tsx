/**
 * Glifos de favorito alineados con maya_dashboard (ApplicationsListPage):
 * estrella rellena / contorno en Unicode.
 */
export const FAVORITE_STAR_FILLED_CHAR = '\u2605' // ★
export const FAVORITE_STAR_OUTLINE_CHAR = '\u2606' // ☆

type FavoriteStarFilledProps = {
  /** Si se omite, solo se usa aria-label. */
  title?: string
  'aria-label'?: string
  className?: string
  /**
   * Si true (defecto), aplica el mismo fondo y texto que el estado «favorita» del listado
   * de aplicaciones en maya_dashboard (`bg-warning-light` + `text-warning-dark` / `dark:text-warning`).
   * Si false, solo el color del glifo (p. ej. sobre fondo ya coloreado).
   */
  withChip?: boolean
}

/**
 * Indicador de favorito relleno (solo lectura), p. ej. junto al título en tablas.
 * Tokens y chip opcional alineados con maya_dashboard (`ApplicationsListPage`).
 */
export function FavoriteStarFilled({
  title,
  'aria-label': ariaLabel = 'Favorite',
  className = '',
  withChip = true,
}: FavoriteStarFilledProps) {
  const chip =
    'rounded-md bg-warning-light dark:bg-warning-dark/40 text-warning-dark dark:text-warning shadow-sm px-1 py-0.5 ' +
    'transition-colors hover:bg-warning-light/80 dark:hover:bg-warning-dark/55 hover:shadow-md'
  const glyphOnly = 'text-warning-dark dark:text-warning'
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center text-base leading-none ${
        withChip ? chip : glyphOnly
      } ${className}`.trim()}
      title={title ?? ariaLabel}
      aria-label={ariaLabel}
      role="img"
    >
      {FAVORITE_STAR_FILLED_CHAR}
    </span>
  )
}
