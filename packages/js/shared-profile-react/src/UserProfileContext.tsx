import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  applyOverridesFromCookie,
  installOverridesListeners,
  readCachedUserProfile,
  useOidcSession,
  writeCachedUserProfile,
} from '@maya/shared-auth-react'
import type { BaseMeProfile } from './types'

export type UserProfileContextValue<TProfile extends BaseMeProfile> = {
  profile: TProfile | null
  loading: boolean
  error: Error | null
  /** Recarga el perfil desde el endpoint `GET /me`. */
  reload: () => Promise<void>
  /** Aplica un perfil ya conocido (p. ej. tras `PUT /me/locale`). */
  setProfile: (next: TProfile) => void
  hasPermission: (code: string) => boolean
}

// Un único contexto, parametrizado en runtime. La tipificación se conserva en
// el helper `createUserProfileContext` que cada app puede usar para obtener
// una versión tipada estricta de `useUserProfile`. Para la mayoría de apps,
// `useUserProfile<TProfile>()` desde el contexto único es suficiente.
const UserProfileContext = createContext<UserProfileContextValue<BaseMeProfile> | undefined>(
  undefined,
)

export type UserProfileProviderProps<TProfile extends BaseMeProfile> = {
  children: ReactNode
  /** Función provista por la app que llama a `GET /me`. */
  fetchProfile: () => Promise<TProfile>
}

export function UserProfileProvider<TProfile extends BaseMeProfile>({
  children,
  fetchProfile,
}: UserProfileProviderProps<TProfile>) {
  const { isOidcSignedIn } = useOidcSession()

  const [profile, setProfileState] = useState<TProfile | null>(
    () => (readCachedUserProfile() as TProfile | null) ?? null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const setProfile = useCallback((next: TProfile) => {
    setProfileState(next)
    writeCachedUserProfile(next)
  }, [])

  const load = useCallback(async () => {
    if (!isOidcSignedIn) {
      setProfileState(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProfile()
      // Tras refrescar /me, fusionamos los overrides cross-subdomain que
      // haya en cookie (puede que otra app del ecosistema haya cambiado
      // locale/employee desde el último mount). `applyOverridesFromCookie`
      // ya escribe en localStorage; replicamos el merge sobre el objeto
      // que vamos a poner en estado para mantener consistencia.
      writeCachedUserProfile(data)
      applyOverridesFromCookie()
      const merged = (readCachedUserProfile() as TProfile | null) ?? data
      setProfileState(merged)
    } catch (e) {
      setProfileState(null)
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setLoading(false)
    }
  }, [isOidcSignedIn, fetchProfile])

  useEffect(() => {
    if (!isOidcSignedIn) {
      setProfileState(null)
      setError(null)
      setLoading(false)
      return
    }
    void load()
  }, [isOidcSignedIn, load])

  // Listeners cross-subdomain (cookie de overrides). Si el usuario muta
  // el perfil en otra app del ecosistema, esta refresca su estado tras
  // visibilitychange / evento same-tab.
  useEffect(() => {
    if (!isOidcSignedIn) return undefined
    const detach = installOverridesListeners()
    const onProfileEvent = (): void => {
      const next = readCachedUserProfile() as TProfile | null
      if (next) setProfileState(next)
    }
    window.addEventListener('maya:profile-overrides', onProfileEvent)
    window.addEventListener('visibilitychange', onProfileEvent)
    return () => {
      detach()
      window.removeEventListener('maya:profile-overrides', onProfileEvent)
      window.removeEventListener('visibilitychange', onProfileEvent)
    }
  }, [isOidcSignedIn])

  const hasPermission = useCallback(
    (code: string) => {
      const list = (profile as unknown as { permissions?: unknown } | null)?.permissions
      return Array.isArray(list) && list.includes(code)
    },
    [profile],
  )

  const value = useMemo<UserProfileContextValue<BaseMeProfile>>(
    () => ({
      profile,
      loading,
      error,
      reload: load,
      setProfile: setProfile as (next: BaseMeProfile) => void,
      hasPermission,
    }),
    [profile, loading, error, load, setProfile, hasPermission],
  )

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>
}

export function useUserProfile<TProfile extends BaseMeProfile = BaseMeProfile>():
  UserProfileContextValue<TProfile> {
  const ctx = useContext(UserProfileContext)
  if (ctx === undefined) {
    throw new Error('useUserProfile debe usarse dentro de UserProfileProvider')
  }
  return ctx as unknown as UserProfileContextValue<TProfile>
}

/**
 * Iniciales para avatar a partir de nombre o email. Devuelve `'U'` si no hay datos.
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
