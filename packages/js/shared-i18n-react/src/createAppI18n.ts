/**
 * createAppI18n — convenience wrapper around createI18n that returns a bundle
 * of `{ i18n, changeLocale }` for the common per-app bootstrap pattern.
 *
 * The 4 apps that use `createI18n` directly follow the exact same boilerplate:
 *
 *   const i18n = createI18n(resources, NAMESPACES)
 *   export function changeLocale(locale) { return i18n.changeLanguage(locale) }
 *   export { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@ceedcv-maya/shared-i18n-react'
 *   export default i18n
 *
 * `createAppI18n` encapsulates that pattern so each app's `src/i18n/index.ts`
 * becomes a one-liner:
 *
 *   export const { i18n, changeLocale } = createAppI18n(resources, NAMESPACES)
 *   export { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@ceedcv-maya/shared-i18n-react'
 *   export default i18n
 *
 * @example
 * // src/i18n/index.ts
 * import { createAppI18n, DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@ceedcv-maya/shared-i18n-react'
 * import { resources, NAMESPACES } from './resources'
 *
 * export const { i18n, changeLocale } = createAppI18n(resources, NAMESPACES)
 * export { DEFAULT_LOCALE, SUPPORTED_LOCALES }
 * export default i18n
 */

import type { Resource, InitOptions } from 'i18next'
import { createI18n } from './createI18n'
import type { SupportedLocale } from './config'

export type CreateAppI18nResult = {
  /** Initialized i18next instance. Pass to <I18nextProvider> if needed. */
  i18n: ReturnType<typeof createI18n>
  /**
   * Change the active locale.  Delegates to `i18n.changeLanguage`.
   */
  changeLocale: (locale: SupportedLocale) => Promise<unknown>
}

/**
 * Factory that initializes an i18next instance and returns it together with
 * a `changeLocale` helper bound to that instance.
 *
 * @param resources - i18next resource bundle (locale → namespace → translations).
 * @param namespaces - List of namespace keys present in `resources`.
 * @param options    - Optional i18next InitOptions overrides (merged over the
 *                     shared Maya defaults, useful for `debug: true` in dev).
 */
export function createAppI18n(
  resources: Resource,
  namespaces: readonly string[],
  /** Optional i18next InitOptions merged over the shared Maya defaults. */
  options?: Partial<InitOptions>,
): CreateAppI18nResult {
  const i18n = createI18n(resources, namespaces, options)

  function changeLocale(locale: SupportedLocale): Promise<unknown> {
    return i18n.changeLanguage(locale)
  }

  return { i18n, changeLocale }
}
