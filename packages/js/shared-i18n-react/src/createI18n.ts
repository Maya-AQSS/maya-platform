/**
 * createI18n — factory that initializes an i18next instance with the
 * standard Maya configuration (LanguageDetector + react-i18next).
 *
 * Each microservice calls this once in its `src/i18n/index.ts`, passing
 * its own resources and namespaces. The shared config (detection order,
 * storage key, interpolation, etc.) lives here so it stays consistent.
 *
 * @example
 * // src/i18n/index.ts
 * import { createI18n } from '@maya/shared-i18n-react'
 * import { resources, NAMESPACES } from './resources'
 *
 * const i18n = createI18n(resources, NAMESPACES)
 * export default i18n
 */
import i18next, { type Resource } from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { readOverrides } from '@maya/shared-auth-react'
import { DEFAULT_LOCALE, STORAGE_KEY, SUPPORTED_LOCALES, type SupportedLocale } from './config'

/**
 * Si la cookie cross-subdomain trae un `locale` más reciente que el de
 * localStorage, lo escribimos antes de que arranque el LanguageDetector
 * (cuyo `lookupLocalStorage` lee esa key). Así el primer paint usa ya el
 * idioma correcto sin un flash de cambio.
 */
function seedLocaleFromOverrides(): void {
  if (typeof window === 'undefined') return
  try {
    const overrides = readOverrides()
    if (!overrides || typeof overrides.locale !== 'string') return
    if (!(SUPPORTED_LOCALES as readonly string[]).includes(overrides.locale)) return
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached === overrides.locale) return
    localStorage.setItem(STORAGE_KEY, overrides.locale)
  } catch {
    /* no-op */
  }
}

let instanceCount = 0

export function createI18n(resources: Resource, namespaces: readonly string[]): typeof i18next {
  seedLocaleFromOverrides()

  const instance = instanceCount === 0 ? i18next : i18next.createInstance()
  instanceCount++

  void instance
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: SUPPORTED_LOCALES as unknown as string[],
      load: 'languageOnly',
      defaultNS: namespaces[0] ?? 'common',
      ns: namespaces as string[],
      interpolation: { escapeValue: false },
      returnNull: false,
      detection: {
        // Locale resolution: localStorage (cache from the cached employee
        // profile) → navigator → htmlTag. Cross-app sync is NOT handled
        // here — it relies on `/me` re-fetch on each app's mount.
        order: ['localStorage', 'navigator', 'htmlTag'],
        lookupLocalStorage: STORAGE_KEY,
        caches: ['localStorage'],
      },
      react: { useSuspense: false },
    })

  if (typeof window !== 'undefined') {
    // Cross-tab same-origin sync: storage event fires in OTHER tabs only.
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        void instance.changeLanguage(e.newValue)
      }
    })
    // Same-tab custom event for components that change locale and want to
    // notify other consumers without a full reload. Kept defensive (no
    // active emitter after LocaleSelector removal).
    window.addEventListener('maya:locale-changed', (e) => {
      const next = (e as CustomEvent<string>).detail
      if (next) void instance.changeLanguage(next)
    })
  }

  return instance
}

/** Change the locale of the global i18next instance (first-created). */
export function changeLocale(locale: SupportedLocale): Promise<unknown> {
  return i18next.changeLanguage(locale)
}

/** Read the current locale from the global i18next instance. */
export function getCurrentLocale(): SupportedLocale {
  const lang = (i18next.resolvedLanguage ?? i18next.language ?? DEFAULT_LOCALE).split('-')[0]
  return (SUPPORTED_LOCALES as readonly string[]).includes(lang)
    ? (lang as SupportedLocale)
    : DEFAULT_LOCALE
}
