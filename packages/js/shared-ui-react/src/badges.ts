/**
 * Helpers para badges semánticos cross-app.
 *
 * Centraliza las clases Tailwind de los badges de estado (borrador, en revisión,
 * aprobado, archivado) y de visibilidad (personal, global, etc.) para que TODAS
 * las vistas usen los mismos colores y los devs no pongan paletas Tailwind a
 * mano. Las clases resuelven a tokens definidos en
 * `maya_infra/configs/styles/index.css` — los colores hex viven en un solo
 * sitio (no en componentes).
 */

/** Unicode characters for favorite star indicators. */
export const FAVORITE_STAR_FILLED_CHAR = '★'
export const FAVORITE_STAR_OUTLINE_CHAR = '☆'

/** Estados típicos de documentos y plantillas. */
export type DocStatus = 'draft' | 'in_review' | 'published' | 'archived'

/** Niveles de visibilidad de plantillas/documentos. */
export type VisibilityLevel = 'personal' | 'global' | 'study_type' | 'study' | 'module' | 'team'

/**
 * Devuelve las clases Tailwind para un badge de estado.
 * Usa los tokens semánticos `warning` (borrador / en revisión), `success`
 * (publicado) y `ui-border/text-secondary` (archivado).
 */
export function statusBadgeClass(status: DocStatus | string): string {
  switch (status) {
    case 'draft':
      return 'bg-warning-light text-warning-dark dark:bg-warning-dark/30 dark:text-warning-light'
    case 'in_review':
      return 'bg-info/15 text-info-dark dark:bg-info-dark/30 dark:text-info-light'
    case 'published':
      return 'bg-success-light text-success-dark dark:bg-success-dark/30 dark:text-success-light'
    case 'archived':
      return 'bg-ui-border text-text-secondary dark:bg-ui-dark-border dark:text-text-dark-secondary'
    default:
      return 'bg-ui-border text-text-secondary dark:bg-ui-dark-border dark:text-text-dark-secondary'
  }
}

/**
 * Devuelve las clases Tailwind para un badge de visibilidad.
 * Usa los tokens `cat-*` definidos en el CSS compartido.
 */
export function visibilityBadgeClass(level: VisibilityLevel | string): string {
  switch (level) {
    case 'personal':
      return 'bg-ui-border text-text-secondary dark:bg-ui-dark-border dark:text-text-dark-secondary'
    case 'global':
      return 'bg-cat-global text-cat-global-fg dark:bg-cat-dark-global dark:text-cat-dark-global-fg'
    case 'study_type':
      return 'bg-cat-study-type text-cat-study-type-fg dark:bg-cat-dark-study-type dark:text-cat-dark-study-type-fg'
    case 'study':
      return 'bg-cat-study text-cat-study-fg dark:bg-cat-dark-study dark:text-cat-dark-study-fg'
    case 'module':
      return 'bg-cat-module text-cat-module-fg dark:bg-cat-dark-module dark:text-cat-dark-module-fg'
    case 'team':
      return 'bg-cat-team text-cat-team-fg dark:bg-cat-dark-team dark:text-cat-dark-team-fg'
    default:
      return 'bg-ui-border text-text-secondary dark:bg-ui-dark-border dark:text-text-dark-secondary'
  }
}
