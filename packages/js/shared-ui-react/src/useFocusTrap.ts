import { useEffect, useRef, type RefObject } from 'react'

/**
 * Selector que identifica los elementos focusables nativos. Usado por
 * `useFocusTrap` para descubrir candidatos al ciclo Tab/Shift+Tab.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]:not([contenteditable="false"])',
].join(',')

function getFocusable(container: HTMLElement): HTMLElement[] {
  const all = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
  return all.filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)
}

type Options = {
  /** Cuando es `false`, el trap está inactivo (no captura Tab ni restaura foco). */
  enabled: boolean
  /** Foco inicial al activarse (default: primer elemento focusable). */
  initialFocus?: RefObject<HTMLElement | null>
  /** Devolver el foco al elemento previamente activo cuando el trap se desactiva. */
  restoreFocus?: boolean
}

/**
 * Atrapa Tab y Shift+Tab dentro del contenedor referenciado mientras `enabled`
 * es `true`. Pensado para diálogos modales y popovers.
 *
 *   const ref = useRef<HTMLDivElement>(null)
 *   useFocusTrap(ref, { enabled: open, restoreFocus: true })
 *
 * El primer elemento focusable recibe foco al activar, salvo que se pase
 * `initialFocus`. Al desactivar (cierre), restaura el foco al elemento que
 * lo tenía cuando se activó.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  { enabled, initialFocus, restoreFocus = true }: Options,
): void {
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled) return
    const container = containerRef.current
    if (!container) return

    previouslyFocused.current = document.activeElement as HTMLElement | null

    const target = initialFocus?.current ?? getFocusable(container)[0] ?? container
    const t = window.setTimeout(() => target.focus(), 0)

    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const focusable = getFocusable(container!)
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (e.shiftKey) {
        if (active === first || !container!.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last || !container!.contains(active)) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
      if (restoreFocus && previouslyFocused.current && document.contains(previouslyFocused.current)) {
        previouslyFocused.current.focus()
      }
    }
  }, [enabled, containerRef, initialFocus, restoreFocus])
}
