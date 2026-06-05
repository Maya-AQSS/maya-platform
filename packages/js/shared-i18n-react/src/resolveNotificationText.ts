/**
 * Re-resolución de notificaciones en cliente.
 *
 * El backend persiste tanto el texto ya renderizado (`title`/`body`, en el
 * locale del worker o del request, que NO tiene por qué ser el del usuario)
 * como las claves i18n + params (`title_key`/`body_key`/`params`). Para que la
 * notificación se muestre SIEMPRE en el idioma del usuario (sincronizado a
 * i18next desde `me.locale`), resolvemos en el cliente contra el namespace
 * `notifications`.
 *
 * El contrato es espejo de `App\Support\NotificationContent::resolve` (backend):
 *   1. Si hay clave y existe traducción → traducir con params.
 *   2. Si no, usar el texto libre del backend (alertas manuales sin clave).
 *   3. Si no, devolver la clave cruda.
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
  /** Texto ya renderizado por el backend; fallback cuando no hay traducción por clave. */
  fallback: string | null | undefined
  /** Params de interpolación (`{{role_name}}`, `{{document_title}}`, …). */
  params?: Record<string, unknown>
}

export type NotificationTextResolver = (input: NotificationTextInput) => string

/**
 * Crea un resolver a partir de las primitivas de i18next. Se expone aparte del
 * hook para poder testearlo sin React.
 */
export function createNotificationTextResolver(
  t: (key: string, options?: Record<string, unknown>) => string,
  exists: (key: string, options?: Record<string, unknown>) => boolean,
): NotificationTextResolver {
  return ({ key, fallback, params }) => {
    if (key) {
      const k = stripNamespace(key)
      if (exists(k, { ns: NOTIFICATIONS_NAMESPACE })) {
        return t(k, { ns: NOTIFICATIONS_NAMESPACE, ...(params ?? {}) })
      }
    }
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

  return useCallback<NotificationTextResolver>(
    (input) =>
      createNotificationTextResolver(
        (key, options) => t(key, options) as string,
        (key, options) => i18n.exists(key, options),
      )(input),
    [t, i18n],
  )
}
