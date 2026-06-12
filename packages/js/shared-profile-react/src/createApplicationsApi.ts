/**
 * Generic factory for the `GET /api/v1/applications?scope=<scope>` endpoint,
 * shared across maya_audit and maya_logs (identical structure, different scope values).
 *
 * @typeParam TScope - String union of valid scope values for the consuming app.
 *   maya_audit: `'all'`
 *   maya_logs:  `'all' | 'with_logs' | 'with_archived_logs'`
 * @typeParam TRef - Application reference shape. Defaults to `ApplicationRef`.
 *
 * @example
 * // maya_audit — src/api/applications.ts
 * import { createApplicationsApi } from '@ceedcv-maya/shared-profile-react'
 * import { apiGetJson } from './http'
 *
 * export type ApplicationScope = 'all'
 * export const { fetchApplications } = createApplicationsApi<ApplicationScope>({ apiGetJson })
 *
 * @example
 * // maya_logs — src/api/applications.ts
 * import { createApplicationsApi } from '@ceedcv-maya/shared-profile-react'
 * import { apiGetJson } from './http'
 *
 * export type ApplicationScope = 'all' | 'with_logs' | 'with_archived_logs'
 * export const { fetchApplications } = createApplicationsApi<ApplicationScope>({ apiGetJson })
 */

export type ApplicationRef = {
  id: number | string
  name: string
  slug: string
}

type ApiGetJson = <T>(path: string) => Promise<T>

type ApplicationsApiDeps = {
  apiGetJson: ApiGetJson
}

type ApiEnvelopeData<T> = {
  data: T
}

export function createApplicationsApi<
  TScope extends string = 'all',
  TRef extends ApplicationRef = ApplicationRef,
>(deps: ApplicationsApiDeps) {
  async function fetchApplications(scope?: TScope): Promise<TRef[]> {
    const resolvedScope = scope ?? ('all' as TScope)
    const qs = new URLSearchParams({ scope: resolvedScope }).toString()
    const body = await deps.apiGetJson<ApiEnvelopeData<TRef[]>>(`applications?${qs}`)
    return body.data
  }

  return { fetchApplications }
}
