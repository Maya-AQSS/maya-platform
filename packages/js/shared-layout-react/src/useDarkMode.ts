import { useEffect, useRef, useState } from 'react'
import { readOverrides, writeOverrides } from '@maya/shared-auth-react'

/**
 * Hook compartido de tema claro/oscuro con sincronización cross-subdomain.
 *
 * Cadena de precedencia al inicializar:
 *   1. Cookie `maya_session_overrides.theme` (única fuente cross-app si
 *      otra app del ecosistema cambió el tema desde su sidebar).
 *   2. `localStorage.maya-theme` (cache local same-origin).
 *   3. `prefers-color-scheme` del sistema operativo.
 *
 * Al cambiar el tema desde ESTA app (`toggle` / `setIsDark`):
 *   - Se aplica `<html class="dark">`.
 *   - Se persiste en `localStorage.maya-theme`.
 *   - Se escribe la cookie compartida `maya_session_overrides.theme`,
 *     que las demás apps leen al recuperar foco.
 *
 * Cuando el cambio llega DESDE FUERA (otra app, otra pestaña):
 *   - `reconcile` recoge el theme de la cookie y actualiza el state local
 *     sin reescribir la cookie (evita bucles).
 */

const STORAGE_KEY = 'maya-theme'
const OVERRIDES_EVENT = 'maya:profile-overrides'

type Theme = 'dark' | 'light'

function readThemeFromOverrides(): Theme | null {
  const overrides = readOverrides()
  if (!overrides) return null
  const value = overrides.theme
  return value === 'dark' || value === 'light' ? value : null
}

function readInitialIsDark(): boolean {
  if (typeof window === 'undefined') return false

  const fromCookie = readThemeFromOverrides()
  if (fromCookie) return fromCookie === 'dark'

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored === 'dark'

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(readInitialIsDark)

  // `true` cuando el cambio se inició localmente (toggle/setIsDark) y aún
  // hay que propagarlo a la cookie. Se baja a `false` en cuanto el effect
  // de propagación lo persiste, o cuando un listener externo entra primero.
  const pendingPropagationRef = useRef<boolean>(false)

  // Efecto único: aplica el tema al DOM, al localStorage y, si el cambio
  // se originó aquí, a la cookie compartida.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const theme: Theme = isDark ? 'dark' : 'light'

    document.documentElement.classList.toggle('dark', isDark)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* localStorage no disponible — ignorable */
    }

    if (pendingPropagationRef.current) {
      pendingPropagationRef.current = false
      const fromCookie = readThemeFromOverrides()
      if (fromCookie !== theme) {
        writeOverrides({ theme })
      }
    }
  }, [isDark])

  // Listeners cross-tab / cross-subdomain: NO escriben cookie, solo
  // actualizan el state local con lo que la cookie ya trae.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const reconcile = (): void => {
      const fromCookie = readThemeFromOverrides()
      if (!fromCookie) return
      setIsDark((current) => {
        const desired = fromCookie === 'dark'
        return current === desired ? current : desired
      })
    }

    const onStorage = (e: StorageEvent): void => {
      if (e.key !== STORAGE_KEY) return
      if (e.newValue !== 'dark' && e.newValue !== 'light') return
      const desired = e.newValue === 'dark'
      setIsDark((current) => (current === desired ? current : desired))
    }

    window.addEventListener(OVERRIDES_EVENT, reconcile)
    document.addEventListener('visibilitychange', reconcile)
    // `focus` y `pageshow` cubren navegadores/contextos donde
    // `visibilitychange` no se dispara al alternar entre ventanas (multi-monitor,
    // popups) o tras navegación back/forward con bfcache.
    window.addEventListener('focus', reconcile)
    window.addEventListener('pageshow', reconcile)
    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener(OVERRIDES_EVENT, reconcile)
      document.removeEventListener('visibilitychange', reconcile)
      window.removeEventListener('focus', reconcile)
      window.removeEventListener('pageshow', reconcile)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const toggle = (): void => {
    pendingPropagationRef.current = true
    setIsDark((d) => !d)
  }

  const setDark = (next: boolean): void => {
    pendingPropagationRef.current = true
    setIsDark(next)
  }

  return { isDark, setIsDark: setDark, toggle } as const
}
