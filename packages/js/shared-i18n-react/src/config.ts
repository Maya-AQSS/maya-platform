/**
 * Canonical locale configuration for the Maya ecosystem.
 *
 * - SUPPORTED_LOCALES: the three supported locales
 * - DEFAULT_LOCALE: fallback when detection fails
 * - DATE_LOCALE_MAP: maps Maya locale codes to BCP-47 tags used by Intl / date-fns
 * - LOCALE_OPTIONS: label map for UI selectors
 * - STORAGE_KEY: localStorage key for the cached locale
 * - USER_PROFILE_STORAGE_KEY: localStorage key for the cached employee profile
 *   (loaded on login, cleared on logout). Includes locale among other fields.
 */

export const SUPPORTED_LOCALES = ['es', 'va', 'en'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = 'es'

export const DATE_LOCALE_MAP: Record<SupportedLocale, string> = {
  es: 'es-ES',
  va: 'ca-ES',
  en: 'en-GB',
}

export const LOCALE_OPTIONS: Array<{ code: SupportedLocale; label: string }> = [
  { code: 'es', label: 'Español' },
  { code: 'va', label: 'Valencià' },
  { code: 'en', label: 'English' },
]

/** localStorage key for the active UI locale. */
export const STORAGE_KEY = 'locale'

/** localStorage key for the cached employee profile JSON. */
export const USER_PROFILE_STORAGE_KEY = 'maya_user_profile'
