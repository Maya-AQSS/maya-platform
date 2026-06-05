/**
 * Bundle de traducciones del namespace `notifications`: títulos/cuerpos de las
 * notificaciones de sistema, espejo del catálogo backend
 * `maya_dashboard/backend/lang/{es,va,en}/notifications.php`.
 *
 * La raíz es el árbol de tipos (`permissions.changed.title`, …) SIN envoltura
 * `notifications`, porque el namespace ya es `notifications`. El frontend
 * re-resuelve `title_key`/`body_key` del backend (que llegan con el prefijo
 * `notifications.`) tras quitar dicho prefijo — ver {@link resolveNotificationText}.
 *
 * Cada app registra este resource en su `i18n/resources.ts`:
 *
 *   import { notificationResources } from '@ceedcv-maya/shared-i18n-react'
 *   export const resources = {
 *     es: { ..., notifications: notificationResources.es.notifications },
 *     ...
 *   }
 */
import esNotifications from './locales/es/notifications.json'
import vaNotifications from './locales/va/notifications.json'
import enNotifications from './locales/en/notifications.json'

export const notificationResources = {
  es: { notifications: esNotifications },
  va: { notifications: vaNotifications },
  en: { notifications: enNotifications },
} as const

export const NOTIFICATIONS_NAMESPACE = 'notifications' as const
