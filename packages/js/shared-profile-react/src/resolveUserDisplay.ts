import type { BaseMeProfile } from './types'
import { profileDisplayInitials } from './profileDisplayInitials'

export type TokenUserClaims = {
  name?: string
  preferred_username?: string
  email?: string
}

export type UserDisplayResult = {
  /** Display name: profile.name → token.name → token.preferred_username → '' */
  userName: string
  /** Avatar initials (2 chars). Uses profileDisplayInitials from profile when available. */
  userInitials: string
  /** Email: profile.email → token.email → undefined */
  userEmail: string | null | undefined
}

/**
 * Resolves display values for the current user from a profile and/or OIDC token claims.
 * Extracted from the repeated inline pattern in all 5 App.tsx files.
 *
 * Priority: profile values > token claims > empty fallback.
 *
 * @example
 * const { profile } = useUserProfile()
 * const { logout, user } = useOidcSession()
 * const { userName, userInitials, userEmail } = resolveUserDisplay(profile, user)
 */
export function resolveUserDisplay(
  profile: BaseMeProfile | null,
  tokenUser?: TokenUserClaims,
): UserDisplayResult {
  // userName
  const profileName = profile?.name?.trim() ?? ''
  const tokenName = ((tokenUser?.name ?? tokenUser?.preferred_username ?? '') as string).trim()
  const userName = profileName || tokenName

  // userInitials
  let userInitials: string
  if (profile) {
    userInitials = profileDisplayInitials(profile)
  } else if (tokenName) {
    const parts = tokenName.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      userInitials =
        `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase().slice(0, 2) || 'U'
    } else {
      userInitials = tokenName.slice(0, 2).toUpperCase() || 'U'
    }
  } else {
    userInitials = 'U'
  }

  // userEmail — profile dominates; if no profile, fall back to token
  const userEmail: string | null | undefined = profile
    ? profile.email
    : (tokenUser?.email as string | undefined)

  return { userName, userInitials, userEmail }
}
