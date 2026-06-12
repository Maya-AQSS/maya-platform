import type { ComponentType, ReactNode } from 'react'
import type { QueryClientConfig } from '@tanstack/react-query'
import type { BaseMeProfile } from '@ceedcv-maya/shared-profile-react'
import type { SharedNotification } from '@ceedcv-maya/shared-sidebar-react'
import type { NavItem } from './types'

// ─── Keycloak adapter shape ───────────────────────────────────────────────────

/** Minimal shape expected from the OIDC auth service (subset of OidcAdapter). */
export interface MayaAuthService {
  /** Raw Keycloak instance. */
  keycloak: {
    token?: string
    tokenParsed?: Record<string, unknown>
    authenticated?: boolean
  }
}

// ─── MayaProviders ────────────────────────────────────────────────────────────

export interface MayaProvidersProps {
  /** Initialised Keycloak-backed auth service. */
  authService: MayaAuthService
  /** Service slug passed to bootstrapRealtime (e.g. 'dms', 'authorization'). */
  serviceSlug: string
  /** Function that fetches the authenticated user profile from GET /me. */
  fetchProfile: () => Promise<BaseMeProfile>
  children: ReactNode
  /**
   * Wrapper component(s) for app-specific providers (e.g. FavoritesProvider,
   * HierarchyProvider). Receives children and should render them unchanged.
   * Multiple providers can be composed: `({ children }) => <A><B>{children}</B></A>`.
   */
  extraProviders?: ComponentType<{ children: ReactNode }>
  /** Mount ToastProvider above the tree (default: false). */
  withToasts?: boolean
  /**
   * Mount an ErrorBoundary with AppErrorFallback around the tree (default: true).
   * Set to false when the app provides its own outermost error boundary (authz pattern).
   */
  withErrorBoundary?: boolean
  /** Override the default QueryClient options (staleTime: 60 000, retry: 1). */
  queryClientOptions?: Pick<
    NonNullable<NonNullable<QueryClientConfig['defaultOptions']>['queries']>,
    'staleTime' | 'retry'
  >
  /** Props forwarded to the AppErrorFallback used inside the ErrorBoundary. */
  errorFallbackProps?: {
    heading?: string
    description?: string
    reloadLabel?: string
  }
}

// ─── MayaAppShell ─────────────────────────────────────────────────────────────

export interface MayaAppShellProps {
  // ── Layout identity ────────────────────────────────────────────────────────
  brandName: string
  brandVersion?: string
  brandLogoUrl?: string

  // ── Routing ────────────────────────────────────────────────────────────────
  /** Full URL of the dashboard (used for the logout-and-redirect target). */
  dashboardUrl: string
  /** API base URL used by NotificationsBell and SidebarFavorites. */
  dashboardApiUrl: string

  // ── Navigation ─────────────────────────────────────────────────────────────
  navItems: NavItem[]

  // ── Permission gate ─────────────────────────────────────────────────────────
  /**
   * Permission slug that the user must hold to access this app.
   * Passed to `useRequireAppAccess` (or `useLogoutWithoutLoginPermission` when
   * `isDashboard` is true).
   */
  loginPermission: string
  /**
   * Slug used as the Keycloak login redirect target when the user lacks
   * loginPermission (default: 'dashboard.login').
   */
  portalLoginSlug?: string
  /**
   * Use `useLogoutWithoutLoginPermission` instead of `useRequireAppAccess`
   * (default: false). Set to true only for the dashboard app.
   */
  isDashboard?: boolean

  // ── Profile / display ──────────────────────────────────────────────────────
  /**
   * Whether to show the "My profile" link in the user block.
   * Pass false to hide it (e.g. when a feature permission guards the page).
   */
  showProfileLink?: boolean

  // ── Notifications / realtime ───────────────────────────────────────────────
  /**
   * Called when the user clicks a notification, allowing the app to navigate
   * with its own router. Falls back to window.location when not provided.
   */
  onNotificationNavigate?: (notification: SharedNotification) => void

  // ── i18n text (no i18next dependency) ─────────────────────────────────────
  loadingInitializingMessage?: string
  loadingRedirectingMessage?: string
  loadingProfileMessage?: string
  loadingNoPermissionMessage?: string
  favoritesLabel?: string

  // ── Slots ──────────────────────────────────────────────────────────────────
  /**
   * Rendered before `<AppLayout>`. Use for null-render logic components
   * (e.g. ReturnToHandler).
   */
  beforeLayout?: ReactNode
  /**
   * Extra content rendered after `<AppLayout>`. Use for app-specific drawers
   * or overlays (e.g. ProcessesDrawer).
   */
  afterLayout?: ReactNode
  /**
   * Extra header content rendered inside the notifications slot area
   * (right side of the top bar).
   */
  headerExtra?: ReactNode

  // ── Routes ─────────────────────────────────────────────────────────────────
  children: ReactNode
}
