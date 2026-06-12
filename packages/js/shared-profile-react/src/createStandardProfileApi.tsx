import type { ReactNode } from 'react'
import type { ApiClient } from '@ceedcv-maya/shared-auth-react'
import { createProfileApi } from './createProfileApi'
import { UserProfileProvider } from './UserProfileContext'
import type { StandardMeProfile } from './StandardMeProfile'

/**
 * Convenience factory that combines `createProfileApi<StandardMeProfile>` with a
 * pre-typed `StandardUserProfileProvider`.
 *
 * Each app that uses `StandardMeProfile` (identical shape 4/4 apps) calls this
 * in its `src/features/user-profile/index.ts` to get:
 * - `fetchMe()` → typed `StandardMeProfile`
 * - `updateMyLocale(locale)` → typed response
 * - `StandardUserProfileProvider` → `UserProfileProvider<StandardMeProfile>` with `fetchMe` pre-wired
 *
 * @example
 * // src/features/user-profile/index.ts
 * import { httpClient } from '../api/http'
 * import { createStandardProfileApi } from '@ceedcv-maya/shared-profile-react'
 *
 * const { fetchMe, updateMyLocale, StandardUserProfileProvider } =
 *   createStandardProfileApi(httpClient)
 *
 * export { fetchMe, updateMyLocale, StandardUserProfileProvider }
 * export { useUserProfile, profileDisplayInitials } from '@ceedcv-maya/shared-profile-react'
 */
export function createStandardProfileApi(
  http: Pick<ApiClient, 'apiGetJson' | 'apiFetchJson'>,
) {
  const { fetchMe, updateMyLocale } = createProfileApi<StandardMeProfile>(http)

  function StandardUserProfileProvider({ children }: { children: ReactNode }) {
    return (
      <UserProfileProvider fetchProfile={fetchMe}>{children}</UserProfileProvider>
    )
  }

  return { fetchMe, updateMyLocale, StandardUserProfileProvider }
}
