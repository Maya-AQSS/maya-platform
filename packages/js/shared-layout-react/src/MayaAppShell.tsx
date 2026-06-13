import { useEffect } from 'react'
import {
  useOidcSession,
} from '@ceedcv-maya/shared-auth-react'
import {
  useUserProfile,
  useRequireAppAccess,
  useLogoutWithoutLoginPermission,
  resolveUserDisplay,
} from '@ceedcv-maya/shared-profile-react'
import {
  NotificationsBell,
  SidebarFavorites,
} from '@ceedcv-maya/shared-sidebar-react'
import { useRealtimeNotifications } from '@ceedcv-maya/shared-realtime-react'
import { useKeycloakLocaleSync } from '@ceedcv-maya/shared-i18n-react'
import { AuthLoadingScreen } from '@ceedcv-maya/shared-ui-react'
import { AppLayout } from './AppLayout'
import type { MayaAppShellProps } from './appShell.types'

// ─── Inner: authenticated + profile loaded ───────────────────────────────────

interface AppWithLayoutProps
  extends Pick<
    MayaAppShellProps,
    | 'brandName'
    | 'brandVersion'
    | 'brandLogoUrl'
    | 'navItems'
    | 'dashboardUrl'
    | 'dashboardApiUrl'
    | 'showProfileLink'
    | 'onProfileNavigate'
    | 'onNotificationNavigate'
    | 'favoritesLabel'
    | 'beforeLayout'
    | 'afterLayout'
    | 'headerExtra'
    | 'children'
  > {}

function AppWithLayout({
  brandName,
  brandVersion,
  brandLogoUrl,
  navItems,
  dashboardUrl,
  dashboardApiUrl,
  showProfileLink = true,
  onProfileNavigate,
  onNotificationNavigate,
  favoritesLabel = 'Favoritas',
  beforeLayout,
  afterLayout,
  headerExtra,
  children,
}: AppWithLayoutProps) {
  const { logout, user } = useOidcSession()
  const { profile } = useUserProfile()

  useKeycloakLocaleSync()
  useRealtimeNotifications({ userId: (user?.sub as string | undefined) ?? null })

  const { userName, userInitials, userEmail } = resolveUserDisplay(
    profile,
    user as Parameters<typeof resolveUserDisplay>[1],
  )

  const onProfile = showProfileLink
    ? onProfileNavigate ?? (() => { window.location.assign(`${dashboardUrl}/profile`) })
    : undefined

  return (
    <>
      {beforeLayout}
      <AppLayout
        navItems={navItems}
        brandName={brandName}
        brandVersion={brandVersion}
        brandLogoUrl={brandLogoUrl}
        userName={userName}
        userEmail={userEmail ?? undefined}
        userInitials={userInitials}
        onLogout={logout}
        onProfile={onProfile}
        favoritesSlot={
          <SidebarFavorites label={favoritesLabel} dashboardApiUrl={dashboardApiUrl} />
        }
        notificationsSlot={
          <>
            <NotificationsBell
              dashboardApiUrl={dashboardApiUrl}
              onNavigate={onNotificationNavigate}
            />
            {headerExtra}
          </>
        }
      >
        {children}
      </AppLayout>
      {afterLayout}
    </>
  )
}

// ─── Inner: profile gate ─────────────────────────────────────────────────────

interface AppAfterProfileProps extends AppWithLayoutProps {
  loginPermission: string
  portalLoginSlug: string
  dashboardUrl: string
  isDashboard: boolean
  loadingProfileMessage: string
  loadingNoPermissionMessage: string
}

function AppAfterProfile({
  loginPermission,
  portalLoginSlug,
  dashboardUrl,
  isDashboard,
  loadingProfileMessage,
  loadingNoPermissionMessage,
  ...layoutProps
}: AppAfterProfileProps) {
  // Dashboard uses the deprecated alias (no portalUrl redirect — it IS the portal).
  const gateResult = isDashboard
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useLogoutWithoutLoginPermission(loginPermission)
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useRequireAppAccess(loginPermission, {
        portalLoginSlug,
        portalUrl: dashboardUrl,
      })

  if (gateResult.profileLoading) {
    return <AuthLoadingScreen message={loadingProfileMessage} />
  }

  if (gateResult.lacksLoginPermission) {
    return <AuthLoadingScreen message={loadingNoPermissionMessage} />
  }

  return <AppWithLayout {...layoutProps} dashboardUrl={dashboardUrl} />
}

// ─── Public: MayaAppShell ────────────────────────────────────────────────────

/**
 * Unified App.tsx body for all Maya apps.
 *
 * Handles:
 * - OIDC initialisation + redirect-to-login
 * - Permission gate (useRequireAppAccess or useLogoutWithoutLoginPermission)
 * - AppLayout wired with NotificationsBell, SidebarFavorites, resolveUserDisplay
 * - useKeycloakLocaleSync + useRealtimeNotifications
 * - Optional beforeLayout/afterLayout slots (ReturnToHandler, ProcessesDrawer)
 *
 * Must be used inside <MayaProviders>.
 */
export function MayaAppShell({
  brandName,
  brandVersion,
  brandLogoUrl,
  dashboardUrl,
  dashboardApiUrl,
  navItems,
  loginPermission,
  portalLoginSlug = 'dashboard.login',
  isDashboard = false,
  showProfileLink = true,
  onProfileNavigate,
  onNotificationNavigate,
  loadingInitializingMessage = 'Iniciando sesión…',
  loadingRedirectingMessage = 'Redirigiendo al inicio de sesión…',
  loadingProfileMessage = 'Cargando perfil…',
  loadingNoPermissionMessage = 'Sin acceso. Redirigiendo…',
  favoritesLabel = 'Favoritas',
  beforeLayout,
  afterLayout,
  headerExtra,
  children,
}: MayaAppShellProps) {
  const { isOidcLoading, isOidcSignedIn, beginSignIn } = useOidcSession()

  useEffect(() => {
    if (!isOidcLoading && !isOidcSignedIn) {
      beginSignIn()
    }
  }, [isOidcLoading, isOidcSignedIn, beginSignIn])

  if (isOidcLoading) {
    return <AuthLoadingScreen message={loadingInitializingMessage} />
  }

  if (!isOidcSignedIn) {
    return <AuthLoadingScreen message={loadingRedirectingMessage} />
  }

  return (
    <AppAfterProfile
      loginPermission={loginPermission}
      portalLoginSlug={portalLoginSlug}
      dashboardUrl={dashboardUrl}
      isDashboard={isDashboard}
      loadingProfileMessage={loadingProfileMessage}
      loadingNoPermissionMessage={loadingNoPermissionMessage}
      brandName={brandName}
      brandVersion={brandVersion}
      brandLogoUrl={brandLogoUrl}
      dashboardApiUrl={dashboardApiUrl}
      navItems={navItems}
      showProfileLink={showProfileLink}
      onProfileNavigate={onProfileNavigate}
      onNotificationNavigate={onNotificationNavigate}
      favoritesLabel={favoritesLabel}
      beforeLayout={beforeLayout}
      afterLayout={afterLayout}
      headerExtra={headerExtra}
    >
      {children}
    </AppAfterProfile>
  )
}

export type { MayaAppShellProps } from './appShell.types'
