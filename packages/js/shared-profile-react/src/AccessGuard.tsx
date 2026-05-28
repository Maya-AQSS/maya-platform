import type { ReactNode } from 'react'
import { useUserProfile } from './UserProfileContext'

export interface AccessGuardProps {
  /** Slug del permiso a comprobar, e.g. "dashboard.alerts.create". */
  permission: string
  /** Qué renderizar si el usuario no tiene el permiso. Default: null. */
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Renderiza `children` si el usuario tiene el permiso indicado.
 * Si no lo tiene, renderiza `fallback` (null por defecto).
 *
 * Requiere que el árbol esté envuelto por `UserProfileProvider`.
 *
 * @example
 * <AccessGuard permission="dashboard.alerts.create" fallback={<p>Sin acceso</p>}>
 *   <CreateAlertButton />
 * </AccessGuard>
 */
export function AccessGuard({ permission, fallback = null, children }: AccessGuardProps): ReactNode {
  const { hasPermission } = useUserProfile()
  return hasPermission(permission) ? children : fallback
}
