import type { ReactNode } from 'react'

type Props = {
  /** Icono o ilustración (SVG, emoji o `<img>`). Tamaño recomendado 48-64 px. */
  icon?: ReactNode
  title: string
  description?: ReactNode
  /** Acciones (botones) — habitualmente uno o dos `<Button>` del mismo paquete. */
  actions?: ReactNode
  className?: string
}

/**
 * Estado vacío genérico para listas, paneles y resultados de búsqueda.
 *
 *   <EmptyState
 *     icon={<FolderIcon />}
 *     title="No hay documentos"
 *     description="Cuando crees tu primer documento aparecerá aquí."
 *     actions={<Button onClick={onCreate}>Crear documento</Button>}
 *   />
 */
export function EmptyState({ icon, title, description, actions, className = '' }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center text-center gap-3 py-12 px-6 ${className}`.trim()}
    >
      {icon ? (
        <div className="text-text-muted dark:text-text-dark-muted size-12 flex items-center justify-center" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-text-primary dark:text-text-dark-primary">
        {title}
      </h3>
      {description ? (
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary max-w-md">
          {description}
        </p>
      ) : null}
      {actions ? <div className="mt-2 flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
