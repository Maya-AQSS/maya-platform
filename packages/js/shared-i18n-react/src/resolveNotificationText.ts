/**
 * Re-resolución de notificaciones en cliente.
 *
 * El backend persiste el texto ya renderizado (`title`/`body`, en el locale del
 * worker o del request, que NO tiene por qué ser el del usuario) y además, según
 * el tipo de notificación:
 *   - Notificaciones de sistema: claves i18n + params (`title_key`/`body_key`/`params`).
 *   - Alertas manuales multiidioma: un mapa por locale en `metadata.i18n`
 *     (`{ title: {es,va,en}, body: {…}, default_locale }`).
 *
 * Para mostrar SIEMPRE el idioma del usuario (i18next sincronizado desde
 * `me.locale`) resolvemos en cliente con esta prioridad:
 *   1. Clave i18n con traducción → traducir con params (sistema).
 *   2. Mapa localizado por locale actual → su valor; si falta, el del default.
 *   3. Texto libre del backend (fallback).
 *   4. La clave cruda.
 */
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { NOTIFICATIONS_NAMESPACE } from './notificationResources'

/** Las claves del backend llegan como `notifications.<type>.title`; el namespace ya es `notifications`. */
function stripNamespace(key: string): string {
  return key.startsWith('notifications.') ? key.slice('notifications.'.length) : key
}

export interface NotificationTextInput {
  /** Clave i18n del backend (p.ej. `notifications.role.assigned.title`), o null. */
  key: string | null | undefined
  /** Texto ya renderizado por el backend; fallback cuando no hay traducción por clave ni mapa. */
  fallback: string | null | undefined
  /** Params de interpolación (`{{role_name}}`, `{{document_title}}`, …). */
  params?: Record<string, unknown>
  /** Mapa { locale: value } para contenido libre multiidioma (alertas manuales). */
  localized?: Record<string, string | undefined> | null
  /** Locale por defecto del mapa localizado (fallback cuando falta el locale actual). */
  localizedDefault?: string | null
}

export type NotificationTextResolver = (input: NotificationTextInput) => string

function pickLocalized(
  localized: Record<string, string | undefined> | null | undefined,
  currentLocale: string,
  localizedDefault: string | null | undefined,
): string | undefined {
  if (!localized) return undefined
  const hit = localized[currentLocale]
  if (hit != null && hit !== '') return hit
  if (localizedDefault) {
    const fb = localized[localizedDefault]
    if (fb != null && fb !== '') return fb
  }
  return undefined
}

/**
 * Crea un resolver a partir de las primitivas de i18next. Se expone aparte del
 * hook para poder testearlo sin React.
 */
export function createNotificationTextResolver(
  t: (key: string, options?: Record<string, unknown>) => string,
  exists: (key: string, options?: Record<string, unknown>) => boolean,
  currentLocale: string,
): NotificationTextResolver {
  return ({ key, fallback, params, localized, localizedDefault }) => {
    if (key) {
      const k = stripNamespace(key)
      if (exists(k, { ns: NOTIFICATIONS_NAMESPACE })) {
        return t(k, { ns: NOTIFICATIONS_NAMESPACE, ...(params ?? {}) })
      }
    }
    const loc = pickLocalized(localized, currentLocale, localizedDefault)
    if (loc != null) return loc
    if (fallback != null && fallback !== '') return fallback
    return key ?? ''
  }
}

/**
 * Hook que devuelve un resolver ligado al i18next del host. Re-renderiza al
 * cambiar de idioma (depende de `i18n.language`).
 */
export function useNotificationText(): NotificationTextResolver {
  const { t, i18n } = useTranslation(NOTIFICATIONS_NAMESPACE)
  const currentLocale = (i18n.resolvedLanguage ?? i18n.language ?? '').split('-')[0]

  return useCallback<NotificationTextResolver>(
    (input) =>
      createNotificationTextResolver(
        (key, options) => t(key, options) as string,
        (key, options) => i18n.exists(key, options),
        currentLocale,
      )(input),
    [t, i18n, currentLocale],
  )
}
