import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import type { ConfirmDialogVariant, ConfirmDialogResult } from './ConfirmDialog'

type ConfirmOptions = {
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmDialogVariant
  icon?: ReactNode
  onConfirm: () => ConfirmDialogResult
}

type ConfirmState = {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  variant?: ConfirmDialogVariant
  icon?: ReactNode
  onConfirm: () => ConfirmDialogResult
}

const initial: ConfirmState = {
  open: false,
  title: '',
  description: undefined,
  confirmLabel: 'Confirmar',
  onConfirm: () => {},
}

/**
 * Hook auxiliar para encadenar `confirm(title, description, onConfirm)` con
 * `<ConfirmDialog>` (shared). Devuelve el estado controlado (compatible con
 * spread directo en `<ConfirmDialog>`) y dos helpers (`confirm`, `closeConfirm`).
 *
 * @example
 *   const { confirmState, confirm, closeConfirm } = useConfirm()
 *   confirm({
 *     title: 'Eliminar rol',
 *     description: '¿Seguro?',
 *     confirmLabel: 'Eliminar',
 *     variant: 'danger',
 *     onConfirm: async () => { await remove.mutateAsync(id) },
 *   })
 *   <ConfirmDialog {...confirmState} onCancel={closeConfirm} />
 *
 * Tras un `onConfirm` async exitoso, `ConfirmDialog` cierra solo (vía `onCancel`).
 * Devuelve `false` o lanza error para mantener el diálogo abierto.
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState>(initial)

  const confirm = useCallback((options: ConfirmOptions) => {
    setState({
      open: true,
      title: options.title,
      description: options.description,
      confirmLabel: options.confirmLabel ?? 'Confirmar',
      cancelLabel: options.cancelLabel,
      variant: options.variant,
      icon: options.icon,
      onConfirm: options.onConfirm,
    })
  }, [])

  const closeConfirm = useCallback(() => {
    setState((s) => ({ ...s, open: false }))
  }, [])

  return { confirmState: state, confirm, closeConfirm }
}
