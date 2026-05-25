import type { ApiClient } from '@ceedcv-maya/shared-auth-react'
import type {
  AcademicContext,
  AcademicContextResponse,
} from './academicContextTypes'

/**
 * Construye los helpers `fetchMyAcademicContext()` / `fetchUserAcademicContext()`
 * sobre el cliente HTTP autenticado de la app. Patrón paralelo a `createProfileApi`.
 *
 * Ejemplo:
 *   const academicApi = createAcademicContextApi(httpClient)
 *   export const { fetchMyAcademicContext, fetchUserAcademicContext } = academicApi
 */
export function createAcademicContextApi(
  http: Pick<ApiClient, 'apiGetJson'>,
) {
  async function fetchMyAcademicContext(): Promise<AcademicContext> {
    const body = await http.apiGetJson<AcademicContextResponse>('me/academic-context')
    return body.data
  }

  async function fetchUserAcademicContext(userId: string): Promise<AcademicContext> {
    const body = await http.apiGetJson<AcademicContextResponse>(`users/${userId}/academic-context`)
    return body.data
  }

  return { fetchMyAcademicContext, fetchUserAcademicContext }
}
