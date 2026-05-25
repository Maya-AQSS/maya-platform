/**
 * Comprueba acceso a un recurso con gate `view_permission_slug` (p. ej. `logs.login`)
 * usando los slugs de `permissions[]` devueltos por GET /me.
 */
export function canAccessByViewPermission(
  viewPermissionSlug: string | null | undefined,
  hasPermission: (slug: string) => boolean,
): boolean {
  const gate = viewPermissionSlug?.trim()
  if (!gate) {
    return true
  }

  return hasPermission(gate)
}
