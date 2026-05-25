import { useTranslation } from 'react-i18next'

interface Props {
  editable: boolean
  onToggle: () => void
  /** Texto del botón cuando NO está en modo edit. Si no se pasa, usa i18n. */
  editLabel?: string
  /** Texto del botón cuando SÍ está en modo edit. Si no se pasa, usa i18n. */
  exitLabel?: string
}

/**
 * Botón compartido para entrar/salir del modo edición de los paneles
 * dashboard. Usa gradiente Maya, visible en ambos temas (claro/oscuro).
 *
 * Texto y estilo idéntico en las 4 apps Maya:
 * - Modo lectura: gradiente púrpura + label de i18n
 * - Modo edit:    fondo verde + label de i18n
 *
 * En viewports < sm el texto se oculta y queda solo el icono (forma circular).
 */
export function DashboardEditToggleButton({
  editable,
  onToggle,
  editLabel,
  exitLabel,
}: Props) {
  const { t } = useTranslation('common')
  const label = editable
    ? (exitLabel ?? t('dashboard.exitEdit', { defaultValue: 'Done' }))
    : (editLabel ?? t('actions.edit', { defaultValue: 'Edit' }))

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={editable}
      aria-label={label}
      title={label}
      className={[
        // Mismo radio (rounded-md) y altura que los botones primary del
        // resto de la app (ver Button.tsx variant sm). El `mr-4` alinea
        // el borde derecho del botón con el borde derecho del bloque
        // de widgets (react-grid-layout aplica containerPadding=16px).
        'inline-flex items-center justify-center h-9 px-4 rounded-md mr-4',
        'text-sm font-semibold tracking-wide',
        'shadow-[0_2px_6px_-2px_rgba(113,75,103,0.45)] hover:shadow-[0_8px_18px_-6px_rgba(113,75,103,0.55)]',
        'transition-all motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-odoo-purple/40',
        editable
          ? 'bg-success hover:bg-success-dark text-text-inverse border border-success-dark dark:border-success'
          : 'bg-gradient-primary bg-gradient-primary-hover text-text-inverse border border-odoo-purple-d dark:border-odoo-dark-purple motion-reduce:bg-odoo-purple motion-reduce:dark:bg-odoo-dark-purple',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
