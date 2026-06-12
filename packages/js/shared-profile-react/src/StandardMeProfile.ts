import type { BaseMeProfile } from './types'

/**
 * Standard shape returned by `GET /api/v1/me` across all 4 Maya apps
 * (authorization, audit, logs, dashboard).
 *
 * Identical to the per-app `MeProfile` type in each frontend:
 *   - maya_authorization/frontend/src/types/users.ts
 *   - maya_audit/frontend/src/types/users.ts
 *   - maya_logs/frontend/src/types/users.ts
 *   - maya_dashboard/frontend/src/types/users.ts
 *
 * Apps that use this as their profile type can stop defining their own
 * `MeProfile` and import this instead.
 */
export type StandardMeProfile = BaseMeProfile & {
  first_name: string | null
  last_name: string | null
  username: string | null
  scope: string
}
