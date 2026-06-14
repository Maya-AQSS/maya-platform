/**
 * Bundle de traducciones del namespace `auditEvents`: etiquetas para los CÓDIGOS
 * neutros de los eventos de auditoría (`actions.*`) y los tipos de entidad
 * (`entityTypes.*`).
 *
 * Contrato cross-app: las apps emisoras (authz, logs, dms, dashboard…) publican
 * únicamente el CÓDIGO del evento (p.ej. `submitted_for_review`, `api_key_regenerated`);
 * el consumidor que renderiza el trail de auditoría (maya_audit) lo traduce al
 * idioma de quien lo visualiza. Este catálogo es la FUENTE ÚNICA de esas etiquetas
 * para que cualquier app que muestre eventos de auditoría reutilice las mismas
 * traducciones sin duplicarlas.
 *
 * Cada app registra este resource en su `i18n/resources.ts`:
 *
 *   import { auditEventResources, AUDIT_EVENTS_NAMESPACE } from '@ceedcv-maya/shared-i18n-react'
 *   export const resources = {
 *     es: { ..., auditEvents: auditEventResources.es.auditEvents },
 *     ...
 *   }
 *
 * y resuelve códigos con los helpers {@link auditActionLabel} / {@link auditEntityTypeLabel}.
 */
import type { TFunction } from 'i18next'

import esAuditEvents from './locales/es/auditEvents.json'
import vaAuditEvents from './locales/va/auditEvents.json'
import enAuditEvents from './locales/en/auditEvents.json'

export const auditEventResources = {
  es: { auditEvents: esAuditEvents },
  va: { auditEvents: vaAuditEvents },
  en: { auditEvents: enAuditEvents },
} as const

export const AUDIT_EVENTS_NAMESPACE = 'auditEvents' as const

/**
 * Traduce un código de acción de auditoría a su etiqueta en el idioma activo.
 * Si el código es desconocido (emisor nuevo aún no catalogado) devuelve el
 * código crudo como fallback. Requiere `t` de `useTranslation` (cualquier
 * namespace; la clave va prefijada con `auditEvents:`).
 */
export function auditActionLabel(code: string | null | undefined, t: TFunction): string {
  if (!code) return ''
  return t(`${AUDIT_EVENTS_NAMESPACE}:actions.${code}`, { defaultValue: code })
}

/** Traduce un código de tipo de entidad de auditoría; fallback al código crudo. */
export function auditEntityTypeLabel(code: string | null | undefined, t: TFunction): string {
  if (!code) return ''
  return t(`${AUDIT_EVENTS_NAMESPACE}:entityTypes.${code}`, { defaultValue: code })
}
