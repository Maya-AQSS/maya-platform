import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'
import { useFocusTrap } from './useFocusTrap'

export type ConfirmDialogVariant = 'primary' | 'teal' | 'danger'

/** `false` mantiene el diálogo abierto; `void`/`true` o promesa resuelta cierran tras confirmar. */
export type ConfirmDialogResult = void | boolean | Promise<void | boolean>

type Props = {
  open: boolean
  title: string
  description?: ReactNode
  error?: string | null
  confirmLabel: string
  cancelLabel?: string
  variant?: ConfirmDialogVariant
  loading?: boolean
  icon?: ReactNode
  onConfirm: () => ConfirmDialogResult
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  error = null,
  confirmLabel,
  cancelLabel,
  variant = 'primary',
  loading = false,
  icon = '⚠️',
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation('common')
  const resolvedCancelLabel = cancelLabel ?? t('actions.cancel', { defaultValue: 'Cancel' })
  const titleId = useId()
  const descId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [confirming, setConfirming] = useState(false)
  const busy = loading || confirming

  useEffect(() => {
    if (!open) setConfirming(false)
  }, [open])

  const handleConfirm = async () => {
    if (busy) return
    setConfirming(true)
    try {
      const result = await Promise.resolve(onConfirm())
      if (result !== false) onCancel()
    } catch {
      // El caller gestiona el error (p. ej. prop `error` o toast); el diálogo permanece abierto.
    } finally {
      setConfirming(false)
    }
  }

  // Foco inicial: primer elemento focusable (p. ej. «Cancelar»), no el de confirmar.
  // Si se enfoca el botón destructivo al abrir, el mouseup del clic que abrió el modal
  // puede generar un segundo «click» fantasma sobre «Confirmar» (borrado sin feedback visual).
  useFocusTrap(dialogRef, { enabled: open, restoreFocus: true })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (!busy) onCancel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const headerBg = variant === 'danger' ? 'bg-danger/5' : variant === 'teal' ? 'bg-odoo-teal/5' : 'bg-odoo-purple/5'

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in" role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="relative w-full max-w-md rounded-xl border border-ui-border dark:border-ui-dark-border bg-ui-card dark:bg-ui-dark-card shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-6 py-5 border-b border-ui-border dark:border-ui-dark-border flex items-center gap-3 ${headerBg}`}>
          {icon && <span className="text-2xl">{icon}</span>}
          <h2 id={titleId} className="text-lg font-bold text-text-primary dark:text-text-dark-primary tracking-tight">
            {title}
          </h2>
        </div>

        {description ? (
          <div
            id={descId}
            className="px-6 py-6 text-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed"
          >
            {description}
          </div>
        ) : null}

        {error ? (
          <div
            className="px-4 py-2.5 border-b border-ui-border dark:border-ui-dark-border bg-error-light/15 dark:bg-error-dark/20"
            role="alert"
          >
            <p className="text-xs font-medium text-danger-dark dark:text-danger">{error}</p>
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-ui-body/50 dark:bg-ui-dark-bg/50 border-t border-ui-border dark:border-ui-dark-border">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="flex-1"
            disabled={busy}
            onClick={onCancel}
          >
            {resolvedCancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant}
            size="md"
            loading={busy}
            className="flex-1"
            onClick={() => void handleConfirm()}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
