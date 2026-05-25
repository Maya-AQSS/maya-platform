import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export type DrawerWidth = 'sm' | 'md' | 'lg' | 'xl'

type Props = {
  open: boolean
  onClose: () => void
  /** Texto del header (string) o slot completo si necesitas más control. */
  title: ReactNode
  /** Cuerpo del drawer; ya viene con padding `px-6 py-5` y scroll. */
  children: ReactNode
  /** Acciones primarias al pie del drawer. */
  footer?: ReactNode
  /** Ancho del panel. Por defecto `md` (460px). */
  width?: DrawerWidth
  /** Posición del panel. Por defecto `right`. */
  side?: 'left' | 'right'
  /** Si false, no se renderiza el botón ✕. */
  showCloseButton?: boolean
  /** Cerrar al hacer click en el backdrop. Por defecto `true`. */
  dismissOnBackdrop?: boolean
}

const WIDTH_CLASS: Record<DrawerWidth, string> = {
  sm: 'w-[360px]',
  md: 'w-[460px]',
  lg: 'w-[560px]',
  xl: 'w-[720px]',
}

const SIDE_CLASS = {
  right: 'right-0 border-l',
  left: 'left-0 border-r',
} as const

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  width = 'md',
  side = 'right',
  showCloseButton = true,
  dismissOnBackdrop = true,
}: Props) {
  const { t } = useTranslation('common')
  const closeLabel = t('actions.close', { defaultValue: 'Close' })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 transition-opacity"
        onClick={dismissOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={[
          'fixed top-12 h-[calc(100vh-3rem)] max-w-full',
          'bg-ui-card dark:bg-ui-dark-card border-ui-border dark:border-ui-dark-border shadow-2xl z-50 flex flex-col',
          WIDTH_CLASS[width],
          SIDE_CLASS[side],
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ui-border dark:border-ui-dark-border shrink-0">
          {typeof title === 'string' ? (
            <h2 className="m-0 text-lg font-semibold text-text-primary dark:text-text-dark-primary truncate">
              {title}
            </h2>
          ) : (
            title
          )}
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              title={closeLabel}
              aria-label={closeLabel}
              className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded text-text-muted hover:bg-ui-body hover:text-text-primary dark:text-text-dark-muted dark:hover:bg-ui-dark-bg dark:hover:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-odoo-purple/30"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-ui-border dark:border-ui-dark-border shrink-0 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </aside>
    </>
  )
}
