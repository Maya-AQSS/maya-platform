import type { ReactNode } from 'react'
import { SkeletonPage } from '@ceedcv-maya/shared-ui-react'
import { useUserProfile } from './UserProfileContext'

export type PermissionGateMode = 'block' | 'hide'

export type PermissionGateProps = {
  /** Slug del permiso a comprobar, e.g. "audit.read". */
  permission: string
  /**
   * - `"block"`: shows a loading skeleton while loading, and an alert div
   *   when the permission is denied (matches maya_audit/logs PermissionGate).
   * - `"hide"`: renders nothing while loading or when denied; optionally
   *   renders a `fallback` node (matches maya_authorization PermissionGuard).
   */
  mode: PermissionGateMode
  children: ReactNode
  /** Fallback node rendered in `"hide"` mode when access is denied. */
  fallback?: ReactNode
  /** Message shown in the denied alert (block mode). Spanish default. */
  deniedMessage?: string
  /** Secondary hint shown in the denied alert (block mode). */
  deniedHint?: string
}

/**
 * Unified permission guard that combines the behaviour of:
 * - `maya_audit/logs PermissionGate` (loading skeleton + denied alert)
 * - `maya_authorization PermissionGuard` (children/fallback, no loading)
 *
 * No hard i18next dependency — strings are injected via props with Spanish
 * defaults so the component works in any app without a specific namespace.
 *
 * @example
 * // block mode (full-page guard with loading state):
 * <PermissionGate permission="audit.read" mode="block">
 *   <AuditPage />
 * </PermissionGate>
 *
 * @example
 * // hide mode (inline element guard):
 * <PermissionGate permission="dashboard.alerts.create" mode="hide">
 *   <CreateAlertButton />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  mode,
  children,
  fallback = null,
  deniedMessage = 'No tienes permiso para acceder a esta sección.',
  deniedHint,
}: PermissionGateProps): ReactNode {
  const { hasPermission, loading } = useUserProfile()

  if (loading) {
    if (mode === 'block') return <SkeletonPage />
    return null
  }

  if (!hasPermission(permission)) {
    if (mode === 'hide') return <>{fallback}</>
    return (
      <div
        role="alert"
        className="px-4 py-6 sm:px-6 lg:px-8 rounded-lg border border-ui-border bg-ui-card dark:border-ui-dark-border dark:bg-ui-dark-card text-center"
      >
        <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary">
          {deniedMessage}
        </p>
        {deniedHint !== undefined ? (
          <p className="mt-2 text-xs text-text-muted dark:text-text-dark-muted">{deniedHint}</p>
        ) : (
          <p className="mt-2 text-xs text-text-muted dark:text-text-dark-muted">
            {`Permiso requerido: ${permission}`}
          </p>
        )}
      </div>
    )
  }

  return <>{children}</>
}
