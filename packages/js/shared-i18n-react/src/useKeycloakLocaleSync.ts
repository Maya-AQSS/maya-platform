import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  STORAGE_KEY,
  SUPPORTED_LOCALES,
  USER_PROFILE_STORAGE_KEY,
  type SupportedLocale,
} from './config'

/**
 * Hidrata i18next con el `locale` del perfil cacheado en localStorage
 * (escrito por el UserProfileProvider al cargar `GET /me`).
 *
 * También mantiene `<html lang>` alineado con el idioma efectivo.
 *
 * NOTA: el nombre `useKeycloakLocaleSync` se mantiene por compatibilidad
 * con los call sites existentes, pero ya no depende del JWT directamente.
 * La fuente es localStorage `maya_user_profile.locale` (poblado por el
 * endpoint `/me` de cada app, que es el que lee del FDW/Odoo).
 */
export function useKeycloakLocaleSync(): void {
  const { i18n } = useTranslation()

  useEffect(() => {
    if (typeof localStorage === 'undefined') return
    let profileLocale: string | undefined
    try {
      const cached = localStorage.getItem(USER_PROFILE_STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached) as { locale?: unknown }
        if (typeof parsed.locale === 'string') profileLocale = parsed.locale
      }
    } catch {
      /* no-op */
    }
    if (!profileLocale) return
    const raw = profileLocale.split('-')[0]
    if (!(SUPPORTED_LOCALES as readonly string[]).includes(raw)) return
    const next = raw as SupportedLocale
    const current = (i18n.resolvedLanguage ?? i18n.language ?? '').split('-')[0]
    if (next === current) return
    void i18n.changeLanguage(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* no-op */
    }
  }, [i18n])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const lang = (i18n.resolvedLanguage ?? i18n.language ?? 'es').split('-')[0]
    // `va` (Valencian) maps to `ca` for the `<html lang>` BCP-47 tag.
    document.documentElement.lang = lang === 'va' ? 'ca' : lang
  }, [i18n.resolvedLanguage, i18n.language])
}
