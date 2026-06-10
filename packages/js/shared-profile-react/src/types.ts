/**
 * Equipo asociado al usuario (departamento académico o grupo de trabajo).
 * Solo aparece en `extra.teams` de `maya_dms` (que materializa los objetos
 * completos via su `UserProfileService`). El resto del ecosistema usa
 * exclusivamente `extra.team_ids` (lista de ids) — para los nombres se
 * consulta `GET /me/academic-context` o `GET /users/{id}/academic-context`.
 */
export type UserTeam = {
  id: string
  name: string
  description?: string | null
  role?: string | null
  is_department?: boolean
}

/**
 * Shape mínimo común a las respuestas de `GET /api/v1/me` de las 5 apps.
 *
 * Forma canónica cross-app (snake_case en inglés): cada app rellena lo que
 * aplica y deja arrays vacíos en los que no le corresponden — el frontend
 * siempre puede asumir la estructura completa sin checks de presencia.
 *
 * - `permissions`: slugs resueltos por maya_authorization (FDW
 *   `user_resolved_permissions` → vista remota por app). En maya_dashboard
 *   el portal usa `v_portal_user_permissions` (todos los permisos, incluidos
 *   `*.login`) para filtrar aplicaciones vía `view_permission_slug`.
 *   Ausente si la resolución falló (degradación silenciosa).
 * - `study_type_ids`, `study_ids`, `module_ids`, `team_ids`: ids de
 *   relaciones académicas (origen: tablas FDW en maya_dms / Odoo).
 * - `teams`: equipos completos (id+name+role+...) — **solo presente en
 *   maya_dms**, que los materializa via su `UserProfileService` local.
 *   El resto de apps NO incluyen este campo en `/me` — usar
 *   `GET /me/academic-context` para los objetos completos.
 */
export type BaseMeProfile = {
  id: string
  email: string | null
  name: string | null
  /** Locale activo del usuario (`es`, `va`, `en`). */
  locale: string
  permissions?: string[]
  /** Roles del usuario resueltos en `/me` (p. ej. `['admin']`). */
  roles?: string[]
  study_type_ids?: string[]
  study_ids?: string[]
  module_ids?: string[]
  team_ids?: string[]
  teams?: UserTeam[]
}

export type MeResponse<TProfile extends BaseMeProfile = BaseMeProfile> = {
  data: TProfile
  meta?: {
    /** `false` cuando el endpoint de escritura es mock (no persiste). */
    locale_persisted?: boolean
    [key: string]: unknown
  }
}

export type UpdateLocaleResponse<TProfile extends BaseMeProfile = BaseMeProfile> =
  MeResponse<TProfile>
