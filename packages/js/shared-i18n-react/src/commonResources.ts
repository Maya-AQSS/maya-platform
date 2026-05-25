/**
 * Bundle de traducciones del namespace `common` compartido por todas las apps
 * del ecosistema (acciones, estados, paginación, severidades…).
 *
 * Cada app fusiona este resource con sus namespaces propios en su
 * `i18n/resources.ts`:
 *
 *   import { commonResources } from '@maya/shared-i18n-react'
 *   export const resources = {
 *     es: { ...commonResources.es, dashboard: esDashboard, ... },
 *     va: { ...commonResources.va, ... },
 *     en: { ...commonResources.en, ... },
 *   }
 */
import esCommon from './locales/es/common.json'
import vaCommon from './locales/va/common.json'
import enCommon from './locales/en/common.json'

export const commonResources = {
  es: { common: esCommon },
  va: { common: vaCommon },
  en: { common: enCommon },
} as const

export const COMMON_NAMESPACE = 'common' as const
