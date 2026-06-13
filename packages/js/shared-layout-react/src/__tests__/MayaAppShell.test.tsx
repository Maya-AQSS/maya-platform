/**
 * MayaAppShell tests
 *
 * Strategy: vi.mock all peerDeps. Tests cover:
 *   1. Shows AuthLoadingScreen while OIDC is loading.
 *   2. Shows AuthLoadingScreen (redirecting) when OIDC is not signed in.
 *   3. Shows AuthLoadingScreen (profile loading) while profile loads.
 *   4. Shows AuthLoadingScreen (no permission) when lacksLoginPermission.
 *   5. Full authenticated render — AppLayout + children mounted.
 *   6. beforeLayout slot is rendered.
 *   7. afterLayout slot is rendered.
 *   8. headerExtra slot is rendered inside AppLayout.
 *   9. isDashboard=true uses useLogoutWithoutLoginPermission.
 *  10. showProfileLink=false suppresses onProfile.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

// ─── Mutable mock state (controlled per-test) ─────────────────────────────────

type OidcState = {
  isOidcLoading: boolean
  isOidcSignedIn: boolean
  user: { sub: string; name: string } | null
}
const oidcState: OidcState = {
  isOidcLoading: false,
  isOidcSignedIn: true,
  user: { sub: 'user-1', name: 'Test User' },
}

type ProfileGateState = {
  profileLoading: boolean
  lacksLoginPermission: boolean
}
const gateState: ProfileGateState = {
  profileLoading: false,
  lacksLoginPermission: false,
}

let logoutWithoutLoginPermissionCalls = 0

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@ceedcv-maya/shared-auth-react', () => ({
  useOidcSession: () => ({
    ...oidcState,
    beginSignIn: vi.fn(),
    logout: vi.fn(),
  }),
}))

vi.mock('@ceedcv-maya/shared-profile-react', () => ({
  useUserProfile: () => ({
    profile: { id: '1', name: 'Test User', email: 'test@ceedcv.es', permissions: ['app.login'] },
    loading: false,
  }),
  useRequireAppAccess: (_slug: string) => ({ ...gateState }),
  useLogoutWithoutLoginPermission: (_slug: string) => {
    logoutWithoutLoginPermissionCalls++
    return { ...gateState }
  },
  resolveUserDisplay: () => ({
    userName: 'Test User',
    userInitials: 'TU',
    userEmail: 'test@ceedcv.es',
  }),
}))

vi.mock('@ceedcv-maya/shared-sidebar-react', () => ({
  NotificationsBell: ({ dashboardApiUrl }: { dashboardApiUrl: string }) => (
    <div data-testid="notifications-bell" data-api={dashboardApiUrl} />
  ),
  SidebarFavorites: () => <div data-testid="sidebar-favorites" />,
}))

vi.mock('@ceedcv-maya/shared-realtime-react', () => ({
  useRealtimeNotifications: vi.fn(),
}))

vi.mock('@ceedcv-maya/shared-i18n-react', () => ({
  useKeycloakLocaleSync: vi.fn(),
}))

vi.mock('@ceedcv-maya/shared-ui-react', () => ({
  AuthLoadingScreen: ({ message }: { message: string }) => (
    <div data-testid="auth-loading-screen">{message}</div>
  ),
}))

// Minimal AppLayout stub — renders children + a few slots for verification
vi.mock('../AppLayout', () => ({
  AppLayout: ({
    children,
    favoritesSlot,
    notificationsSlot,
    brandName,
    onProfile,
  }: {
    children: ReactNode
    favoritesSlot?: ReactNode
    notificationsSlot?: ReactNode
    brandName: string
    onProfile?: () => void
  }) => (
    <div data-testid="app-layout" data-brand={brandName}>
      <div data-testid="layout-notifications">{notificationsSlot}</div>
      <div data-testid="layout-favorites">{favoritesSlot}</div>
      {onProfile && <button data-testid="profile-btn" onClick={onProfile}>Profile</button>}
      <main>{children}</main>
    </div>
  ),
}))

// ─── Import under test ────────────────────────────────────────────────────────

import { MayaAppShell } from '../MayaAppShell'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultProps = {
  brandName: 'TestApp',
  brandVersion: 'v1.0',
  dashboardUrl: 'https://dashboard.maya.test',
  dashboardApiUrl: 'https://dashboard-api.maya.test/api/v1',
  navItems: [],
  loginPermission: 'app.login',
}

function renderShell(overrides: Partial<typeof defaultProps & { isDashboard: boolean }> = {}) {
  return render(
    <MayaAppShell {...defaultProps} {...overrides}>
      <div data-testid="app-routes">App routes here</div>
    </MayaAppShell>,
  )
}

/**
 * jsdom marks `window.location.assign` non-configurable, so vi.spyOn fails.
 * Swap the whole `location` object for a configurable stub and restore it.
 */
function stubLocationAssign() {
  const original = window.location
  const assign = vi.fn()
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...original, assign },
  })
  return {
    assign,
    restore: () =>
      Object.defineProperty(window, 'location', { configurable: true, value: original }),
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MayaAppShell', () => {
  afterEach(() => {
    cleanup()
    // Reset mutable state
    oidcState.isOidcLoading = false
    oidcState.isOidcSignedIn = true
    oidcState.user = { sub: 'user-1', name: 'Test User' }
    gateState.profileLoading = false
    gateState.lacksLoginPermission = false
    logoutWithoutLoginPermissionCalls = 0
    vi.clearAllMocks()
  })

  // ── OIDC states ─────────────────────────────────────────────────────────────

  it('shows AuthLoadingScreen with initializing message while OIDC is loading', () => {
    oidcState.isOidcLoading = true
    oidcState.isOidcSignedIn = false

    renderShell()

    const el = screen.getByTestId('auth-loading-screen')
    expect(el).toBeTruthy()
    expect(el.textContent).toBe('Iniciando sesión…')
  })

  it('shows AuthLoadingScreen with redirecting message when not signed in', () => {
    oidcState.isOidcLoading = false
    oidcState.isOidcSignedIn = false

    renderShell()

    const el = screen.getByTestId('auth-loading-screen')
    expect(el.textContent).toBe('Redirigiendo al inicio de sesión…')
  })

  it('accepts custom OIDC loading messages via props', () => {
    oidcState.isOidcLoading = true
    oidcState.isOidcSignedIn = false

    render(
      <MayaAppShell
        {...defaultProps}
        loadingInitializingMessage="Autenticando..."
        loadingRedirectingMessage="Enviando al login..."
      >
        <div />
      </MayaAppShell>,
    )

    expect(screen.getByTestId('auth-loading-screen').textContent).toBe('Autenticando...')
  })

  // ── Profile gate ─────────────────────────────────────────────────────────────

  it('shows AuthLoadingScreen while profile is loading', () => {
    gateState.profileLoading = true

    renderShell()

    const el = screen.getByTestId('auth-loading-screen')
    expect(el.textContent).toBe('Cargando perfil…')
  })

  it('shows AuthLoadingScreen when user lacks login permission', () => {
    gateState.lacksLoginPermission = true

    renderShell()

    const el = screen.getByTestId('auth-loading-screen')
    expect(el.textContent).toBe('Sin acceso. Redirigiendo…')
  })

  // ── Full authenticated render ─────────────────────────────────────────────

  it('renders AppLayout with children when fully authenticated', () => {
    renderShell()

    expect(screen.getByTestId('app-layout')).toBeTruthy()
    expect(screen.getByTestId('app-routes')).toBeTruthy()
  })

  it('mounts NotificationsBell inside layout notifications slot', () => {
    renderShell()

    expect(screen.getByTestId('notifications-bell')).toBeTruthy()
  })

  it('mounts SidebarFavorites inside layout favorites slot', () => {
    renderShell()

    expect(screen.getByTestId('sidebar-favorites')).toBeTruthy()
  })

  it('passes brandName to AppLayout', () => {
    renderShell({ brandName: 'AudiCEED' })

    const layout = screen.getByTestId('app-layout')
    expect(layout.getAttribute('data-brand')).toBe('AudiCEED')
  })

  it('renders a profile button by default (showProfileLink=true)', () => {
    renderShell()
    expect(screen.queryByTestId('profile-btn')).toBeTruthy()
  })

  it('suppresses profile button when showProfileLink=false', () => {
    render(
      <MayaAppShell {...defaultProps} showProfileLink={false}>
        <div />
      </MayaAppShell>,
    )
    expect(screen.queryByTestId('profile-btn')).toBeNull()
  })

  it('invokes onProfileNavigate (SPA) instead of reloading when provided', () => {
    const onProfileNavigate = vi.fn()
    const { assign, restore } = stubLocationAssign()

    render(
      <MayaAppShell {...defaultProps} onProfileNavigate={onProfileNavigate}>
        <div />
      </MayaAppShell>,
    )
    screen.getByTestId('profile-btn').click()

    expect(onProfileNavigate).toHaveBeenCalledTimes(1)
    expect(assign).not.toHaveBeenCalled()
    restore()
  })

  it('falls back to full reload when onProfileNavigate is not provided', () => {
    const { assign, restore } = stubLocationAssign()

    renderShell()
    screen.getByTestId('profile-btn').click()

    expect(assign).toHaveBeenCalledWith('https://dashboard.maya.test/profile')
    restore()
  })

  it('does not wire onProfileNavigate when showProfileLink=false', () => {
    const onProfileNavigate = vi.fn()
    render(
      <MayaAppShell
        {...defaultProps}
        showProfileLink={false}
        onProfileNavigate={onProfileNavigate}
      >
        <div />
      </MayaAppShell>,
    )
    expect(screen.queryByTestId('profile-btn')).toBeNull()
    expect(onProfileNavigate).not.toHaveBeenCalled()
  })

  // ── Slots ─────────────────────────────────────────────────────────────────

  it('renders beforeLayout slot before AppLayout', () => {
    render(
      <MayaAppShell
        {...defaultProps}
        beforeLayout={<div data-testid="before-layout">before</div>}
      >
        <div />
      </MayaAppShell>,
    )
    expect(screen.getByTestId('before-layout')).toBeTruthy()
    expect(screen.getByTestId('app-layout')).toBeTruthy()
  })

  it('renders afterLayout slot after AppLayout', () => {
    render(
      <MayaAppShell
        {...defaultProps}
        afterLayout={<div data-testid="after-layout">drawer</div>}
      >
        <div />
      </MayaAppShell>,
    )
    expect(screen.getByTestId('after-layout')).toBeTruthy()
    expect(screen.getByTestId('app-layout')).toBeTruthy()
  })

  it('renders headerExtra inside the notifications slot', () => {
    render(
      <MayaAppShell
        {...defaultProps}
        headerExtra={<button data-testid="extra-header-btn">Extra</button>}
      >
        <div />
      </MayaAppShell>,
    )
    expect(screen.getByTestId('extra-header-btn')).toBeTruthy()
    // Must be inside the notifications slot container
    const notificationsSlot = screen.getByTestId('layout-notifications')
    expect(notificationsSlot.contains(screen.getByTestId('extra-header-btn'))).toBe(true)
  })

  // ── isDashboard mode ─────────────────────────────────────────────────────

  it('uses useLogoutWithoutLoginPermission when isDashboard=true', () => {
    render(
      <MayaAppShell {...defaultProps} isDashboard>
        <div />
      </MayaAppShell>,
    )
    expect(logoutWithoutLoginPermissionCalls).toBeGreaterThan(0)
  })
})
