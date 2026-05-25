import { useEffect, useRef } from 'react'
import { useOidcSession } from '@ceedcv-maya/shared-auth-react'
import { useUserProfile } from './UserProfileContext'

/**
 * Opciones para `useRequireAppAccess`.
 *
 * `portalLoginSlug` + `portalUrl` definen el comportamiento cuando el
 * usuario está logueado pero carece del permiso de entrada de la app
 * actual. Si tiene `portalLoginSlug` en sus permisos cross-app, se le
 * redirige al portal (típicamente el dashboard). Si no, se cierra sesión.
 */
export interface RequireAppAccessOptions {
  /** Slug que identifica al portal central. Default: `'dashboard.login'`. */
  portalLoginSlug?: string
  /** Origin absoluto del portal para `window.location.assign`. */
  portalUrl?: string
}

/**
 * Tras cargar GET /me, decide qué hacer si al usuario le falta el permiso
 * de entrada de la app actual (ej. `logs.login`):
 *
 * - Si tiene `portalLoginSlug` en `permissions[]` y se pasó `portalUrl`,
 *   redirige al portal preservando la sesión SSO.
 * - En otro caso, cierra sesión SSO (logout).
 *
 * Pre-requisito: `/me` devuelve `permissions[]` cross-app (todos los
 * slugs del usuario en las 5 apps). El backend lo expone tras el
 * cambio de 2026-05-21 (vista `v_portal_user_permissions`).
 *
 * Devuelve `{ profileLoading, lacksLoginPermission }` para que el
 * caller renderice un loading state mientras se decide.
 */
export function useRequireAppAccess(
  loginPermissionSlug: string,
  options?: RequireAppAccessOptions,
): { profileLoading: boolean; lacksLoginPermission: boolean } {
  const { logout, isOidcSignedIn } = useOidcSession()
  const { profile, loading: profileLoading } = useUserProfile()
  const didAct = useRef(false)

  const permissions = profile?.permissions
  const permissionsResolved = Array.isArray(permissions)

  // Solo actuamos si /me devolvió permissions[] y el slug de la app no está.
  const lacksLoginPermission =
    isOidcSignedIn &&
    !profileLoading &&
    permissionsResolved &&
    !permissions.includes(loginPermissionSlug)

  useEffect(() => {
    if (!lacksLoginPermission || didAct.current) {
      return
    }
    didAct.current = true

    const portalSlug = options?.portalLoginSlug ?? 'dashboard.login'
    const portalUrl = options?.portalUrl
    const hasPortalAccess = Array.isArray(permissions) && permissions.includes(portalSlug)

    if (hasPortalAccess && typeof portalUrl === 'string' && portalUrl !== '') {
      // Redirect al portal — la sesión SSO se preserva; el portal carga
      // su propio /me con los mismos permisos y muestra solo las apps
      // accesibles.
      window.location.assign(portalUrl)
      return
    }

    // Sin acceso al portal (o sin URL configurada) → logout completo.
    void logout()
  }, [lacksLoginPermission, logout, permissions, options?.portalLoginSlug, options?.portalUrl])

  return { profileLoading, lacksLoginPermission }
}

/**
 * Alias retro-compatible con el nombre anterior. Llama a
 * `useRequireAppAccess` sin `portalUrl`, por lo que el comportamiento
 * efectivo es el mismo de antes (logout cuando falta el permiso).
 * Los nuevos callers deben usar `useRequireAppAccess` directamente y
 * pasar `portalUrl` si quieren redirect al portal.
 *
 * @deprecated Usa `useRequireAppAccess(loginSlug, { portalUrl })`.
 */
export function useLogoutWithoutLoginPermission(loginPermissionSlug: string): {
  profileLoading: boolean
  lacksLoginPermission: boolean
} {
  return useRequireAppAccess(loginPermissionSlug)
}
