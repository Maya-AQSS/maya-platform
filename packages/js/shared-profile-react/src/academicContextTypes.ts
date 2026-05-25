/**
 * Tipos del contexto académico (study_types, studies, course_modules, teams)
 * con id+code+name por entidad. Forma canónica que devuelve el endpoint
 * compartido `GET /api/v1/me/academic-context` y `GET /users/{id}/academic-context`.
 */

export type AcademicBlockKey = 'study_types' | 'studies' | 'modules' | 'teams'

export type AcademicBlockStatus = 'ok' | 'unavailable'

export interface AcademicItem {
  id: string
  code: string
  name: string
}

export interface AcademicStudy extends AcademicItem {
  study_type_id: string
}

export interface AcademicModule extends AcademicItem {
  study_id: string
}

export interface AcademicTeam extends AcademicItem {
  is_department: boolean
}

export interface AcademicContext {
  study_types: AcademicItem[]
  studies: AcademicStudy[]
  modules: AcademicModule[]
  teams: AcademicTeam[]
  _status: Record<AcademicBlockKey, AcademicBlockStatus>
}

/**
 * Shape envuelto que devuelve la API (Laravel JsonResource).
 */
export interface AcademicContextResponse {
  data: AcademicContext
}
