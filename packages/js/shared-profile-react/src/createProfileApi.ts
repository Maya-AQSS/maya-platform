import type { ApiClient } from '@maya/shared-auth-react'
import type {
  BaseMeProfile,
  MeResponse,
  UpdateLocaleResponse,
} from './types'

/**
 * Construye los helpers `fetchMe()` / `updateMyLocale()` sobre el cliente
 * HTTP autenticado de la app. Cada app llama esto una vez (en `api/profile.ts`)
 * y exporta los helpers tipados con su `MeProfile` local.
 *
 * Ejemplo:
 *   const profileApi = createProfileApi&lt;MeProfile&gt;(httpClient)
 *   export const { fetchMe, updateMyLocale } = profileApi
 */
export function createProfileApi<TProfile extends BaseMeProfile = BaseMeProfile>(
  http: Pick<ApiClient, 'apiGetJson' | 'apiFetchJson'>,
) {
  async function fetchMe(): Promise<TProfile> {
    const body = await http.apiGetJson<MeResponse<TProfile>>('me')
    return body.data
  }

  async function updateMyLocale(locale: string): Promise<UpdateLocaleResponse<TProfile>> {
    return http.apiFetchJson<UpdateLocaleResponse<TProfile>>('me/locale', {
      method: 'PUT',
      body: { locale },
    })
  }

  return { fetchMe, updateMyLocale }
}
