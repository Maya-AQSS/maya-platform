/**
 * useLocale — convenience hook that wraps react-i18next's useTranslation
 * and exposes the Maya-specific locale context (BCP47 date locale, locale options).
 *
 * Apps that need only basic translations can use `useTranslation()` directly.
 * This hook is for components that also need `dateLocale` or `setLocale`.
 *
 * `setLocale` actualiza:
 *   1. i18next (en esta app).
 *   2. localStorage `locale` + `maya_user_profile.locale` (cache de esta app).
 *   3. Cookie `maya_session_overrides` con `Domain=localhost` — canal
 *      cross-subdomain que permite que el resto de apps abiertas detecten
 *      el cambio sin recargar.
 * El caller (típicamente ProfilePage en dashboard) sigue siendo quien
 * llama al endpoint `PUT /api/v1/me/locale` para el path real cuando
 * exista; este hook solo aplica el efecto local + propagación.
 */
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { writeOverrides } from '@ceedcv-maya/shared-auth-react'
import {
  DATE_LOCALE_MAP,
  LOCALE_OPTIONS,
  STORAGE_KEY,
  SUPPORTED_LOCALES,
  USER_PROFILE_STORAGE_KEY,
  type SupportedLocale,
} from './config'

export interface UseLocaleReturn {
  /** Current active locale (e.g. 'es', 'va', 'en') */
  locale: SupportedLocale
  /** BCP-47 tag for Intl / date-fns (e.g. 'es-ES', 'ca-ES', 'en-GB') */
  dateLocale: string
  /** i18next t function */
  t: ReturnType<typeof useTranslation>['t']
  /**
   * Apply a locale change locally: update i18next, persist to localStorage
   * (so the next mount detects it), and sync the cached employee profile.
   * Does NOT call the backend — the caller persists separately.
   */
  setLocale: (locale: string) => void
  /** All supported locales */
  supportedLocales: readonly string[]
  /** Options for a locale selector UI */
  localeOptions: typeof LOCALE_OPTIONS
}

export function useLocale(): UseLocaleReturn {
  const { i18n, t } = useTranslation()

  const setLocale = useCallback(
    (next: string) => {
      if (!(SUPPORTED_LOCALES as readonly string[]).includes(next)) return
      void i18n.changeLanguage(next)
      try {
        localStorage.setItem(STORAGE_KEY, next)
        const cached = localStorage.getItem(USER_PROFILE_STORAGE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached) as Record<string, unknown>
          parsed.locale = next
          localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(parsed))
        }
      } catch {
        /* no-op */
      }
      // Propaga el cambio al resto de subdominios vía cookie compartida.
      writeOverrides({ locale: next })
    },
    [i18n],
  )

  const rawLocale = (i18n.resolvedLanguage ?? i18n.language ?? 'es').split('-')[0]
  const locale: SupportedLocale = (SUPPORTED_LOCALES as readonly string[]).includes(rawLocale)
    ? (rawLocale as SupportedLocale)
    : 'es'

  const dateLocale = DATE_LOCALE_MAP[locale] ?? 'en-GB'

  return {
    locale,
    dateLocale,
    t,
    setLocale,
    supportedLocales: SUPPORTED_LOCALES,
    localeOptions: LOCALE_OPTIONS,
  }
}
