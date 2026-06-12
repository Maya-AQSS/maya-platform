import type { BaseMeProfile } from './types'

/**
 * Iniciales para avatar a partir de nombre o email. Devuelve `'U'` si no hay datos.
 * Función pura sin dependencias de React — se puede importar desde tests sin
 * necesitar el contexto de shared-auth-react.
 */
export function profileDisplayInitials(profile: BaseMeProfile | null): string {
  if (!profile) return 'U'
  const base = (profile.name?.trim() || profile.email?.trim() || '') as string
  if (!base) return 'U'
  const parts = base.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase().slice(0, 2) || 'U'
  }
  return base.slice(0, 2).toUpperCase()
}
