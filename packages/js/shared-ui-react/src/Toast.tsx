import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'

export type ToastTone = 'info' | 'success' | 'warning' | 'danger'

export type ToastInput = {
  /** Etiqueta principal. */
  title: string
  /** Texto secundario opcional. */
  description?: string
  /** Tono visual. Default `'info'`. */
  tone?: ToastTone
  /** Duración en ms antes del auto-cierre. Default 4000. `0` = persistente. */
  duration?: number
}

type Toast = ToastInput & {
  id: string
}

type ToastContextValue = {
  show: (input: ToastInput) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast() debe usarse dentro de <ToastProvider>')
  }
  return ctx
}

type ToastProviderProps = {
  children: ReactNode
  /** Esquina del viewport. Default `bottom-right`. */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

const positionClass: Record<NonNullable<ToastProviderProps['position']>, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
}

/**
 * Provider global para toasts. Envolver la app:
 *
 *   <ToastProvider>
 *     <App />
 *   </ToastProvider>
 *
 * Y usar desde cualquier componente:
 *
 *   const { show } = useToast()
 *   show({ title: 'Documento creado', tone: 'success' })
 */
export function ToastProvider({ children, position = 'bottom-right' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const show = useCallback(
    (input: ToastInput): string => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const toast: Toast = { id, tone: 'info', duration: 4000, ...input }
      setToasts((prev) => [...prev, toast])
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => dismiss(id), toast.duration)
        timersRef.current.set(id, timer)
      }
      return id
    },
    [dismiss],
  )

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
    }
  }, [])

  const ctx = useMemo<ToastContextValue>(() => ({ show, dismiss }), [show, dismiss])

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} position={position} />
    </ToastContext.Provider>
  )
}

const toneClass: Record<ToastTone, string> = {
  info: 'border-info/40 bg-info-light text-info-dark dark:bg-info-dark/30 dark:text-info-light dark:border-info-dark/50',
  success:
    'border-success/40 bg-success-light text-success-dark dark:bg-success-dark/30 dark:text-success-light dark:border-success-dark/50',
  warning:
    'border-warning/50 bg-warning-light text-warning-dark dark:bg-warning-dark/30 dark:text-warning-light dark:border-warning-dark/50',
  danger:
    'border-danger/40 bg-danger-light text-danger-dark dark:bg-danger-dark/30 dark:text-danger-light dark:border-danger-dark/50',
}

type ViewportProps = {
  toasts: Toast[]
  onDismiss: (id: string) => void
  position: NonNullable<ToastProviderProps['position']>
}

function ToastViewport({ toasts, onDismiss, position }: ViewportProps) {
  const { t } = useTranslation('common')
  const liveId = useId()
  return (
    <div
      id={liveId}
      role="region"
      aria-label={t('toast.regionAriaLabel', { defaultValue: 'Notifications' })}
      className={`fixed z-[var(--z-index-toast,500)] flex flex-col gap-2 pointer-events-none ${positionClass[position]}`}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} position={position} />
      ))}
    </div>
  )
}

const enterAnim: Record<NonNullable<ToastProviderProps['position']>, string> = {
  'top-right': 'motion-safe:animate-slide-in-right',
  'bottom-right': 'motion-safe:animate-slide-in-right',
  'top-left': 'motion-safe:animate-slide-in-left',
  'bottom-left': 'motion-safe:animate-slide-in-left',
}

function ToastItem({
  toast,
  onDismiss,
  position,
}: {
  toast: Toast
  onDismiss: (id: string) => void
  position: NonNullable<ToastProviderProps['position']>
}) {
  const { t } = useTranslation('common')
  const tone = toast.tone ?? 'info'
  const role = tone === 'danger' || tone === 'warning' ? 'alert' : 'status'
  const liveAttr = role === 'alert' ? 'assertive' : 'polite'

  return (
    <div
      role={role}
      aria-live={liveAttr}
      className={`pointer-events-auto min-w-[280px] max-w-sm border rounded-lg shadow-card-md px-4 py-3 ${enterAnim[position]} ${toneClass[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">{toast.title}</p>
          {toast.description ? (
            <p className="text-xs mt-1 opacity-90 leading-snug">{toast.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label={t('toast.closeAriaLabel', { defaultValue: 'Close notification' })}
          className="-mt-1 -mr-1 size-6 inline-flex items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    </div>
  )
}
