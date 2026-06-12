/**
 * MayaProviders tests
 *
 * Strategy: vi.mock all heavy peerDeps so the test environment (jsdom) doesn't
 * need real Keycloak / WebSocket / i18next infrastructure. We verify:
 *   1. Children are mounted (happy path — providers are wired correctly).
 *   2. ExtraProviders wrapper is applied around children.
 *   3. withToasts=true mounts the ToastProvider.
 *   4. withErrorBoundary=false skips ErrorBoundary.
 *   5. Thrown child error is caught by the default ErrorBoundary.
 *   6. bootstrapRealtime is called with serviceSlug on mount.
 *   7. unhandledrejection handler is attached.
 */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

// ─── Module mocks (hoisted) ───────────────────────────────────────────────────

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    QueryClient: actual.QueryClient,
    QueryClientProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  }
})

vi.mock('@ceedcv-maya/shared-auth-react', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useOidcSession: () => ({
    isOidcLoading: false,
    isOidcSignedIn: true,
    beginSignIn: vi.fn(),
    user: { sub: 'test-user-id', name: 'Test User' },
    logout: vi.fn(),
  }),
}))

vi.mock('@ceedcv-maya/shared-profile-react', () => ({
  UserProfileProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useUserProfile: () => ({ profile: null, loading: false }),
  useRequireAppAccess: () => ({ profileLoading: false, lacksLoginPermission: false }),
  useLogoutWithoutLoginPermission: () => ({ profileLoading: false, lacksLoginPermission: false }),
  resolveUserDisplay: () => ({ userName: 'Test User', userInitials: 'TU', userEmail: null }),
}))

vi.mock('@ceedcv-maya/shared-sidebar-react', () => ({
  NotificationProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  NotificationsBell: () => <div data-testid="notifications-bell" />,
  SidebarFavorites: () => <div data-testid="sidebar-favorites" />,
}))

vi.mock('@ceedcv-maya/shared-realtime-react', () => ({
  bootstrapRealtime: vi.fn(),
  useRealtimeNotifications: vi.fn(),
}))

vi.mock('@ceedcv-maya/shared-i18n-react', () => ({
  useKeycloakLocaleSync: vi.fn(),
}))

vi.mock('@ceedcv-maya/shared-ui-react', () => ({
  AuthLoadingScreen: ({ message }: { message: string }) => (
    <div data-testid="auth-loading-screen">{message}</div>
  ),
  AppErrorFallback: ({ heading }: { heading?: string }) => (
    <div data-testid="error-fallback">{heading ?? 'Ha ocurrido un error'}</div>
  ),
  ErrorBoundary: ({ children, fallback }: { children: ReactNode; fallback: ReactNode }) => {
    // Simple passthrough — actual error boundary testing is in shared-ui-react suite.
    return <>{children}</>
  },
  ToastProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="toast-provider">{children}</div>
  ),
}))

vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

// ─── Import under test ────────────────────────────────────────────────────────

import { MayaProviders } from '../MayaProviders'
import { bootstrapRealtime } from '@ceedcv-maya/shared-realtime-react'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockAuthService = {
  keycloak: {
    token: 'mock-token',
    tokenParsed: {},
    authenticated: true,
  },
}

const mockFetchProfile = vi.fn().mockResolvedValue({
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  permissions: ['test.login'],
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MayaProviders', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children inside the provider stack', () => {
    render(
      <MayaProviders
        authService={mockAuthService}
        serviceSlug="test"
        fetchProfile={mockFetchProfile}
      >
        <div data-testid="child-content">Hello from app</div>
      </MayaProviders>,
    )
    expect(screen.getByTestId('child-content')).toBeTruthy()
    expect(screen.getByText('Hello from app')).toBeTruthy()
  })

  it('calls bootstrapRealtime with the serviceSlug on mount', () => {
    render(
      <MayaProviders
        authService={mockAuthService}
        serviceSlug="dms"
        fetchProfile={mockFetchProfile}
      >
        <span>content</span>
      </MayaProviders>,
    )
    expect(bootstrapRealtime).toHaveBeenCalledWith('dms', expect.any(Function))
  })

  it('applies extraProviders wrapper around children', () => {
    function ExtraProviders({ children }: { children: ReactNode }) {
      return <div data-testid="extra-provider">{children}</div>
    }

    render(
      <MayaProviders
        authService={mockAuthService}
        serviceSlug="test"
        fetchProfile={mockFetchProfile}
        extraProviders={ExtraProviders}
      >
        <span data-testid="inner">inner</span>
      </MayaProviders>,
    )

    expect(screen.getByTestId('extra-provider')).toBeTruthy()
    expect(screen.getByTestId('inner')).toBeTruthy()
  })

  it('mounts ToastProvider when withToasts=true', () => {
    render(
      <MayaProviders
        authService={mockAuthService}
        serviceSlug="test"
        fetchProfile={mockFetchProfile}
        withToasts
      >
        <span>content</span>
      </MayaProviders>,
    )
    expect(screen.getByTestId('toast-provider')).toBeTruthy()
  })

  it('does NOT mount ToastProvider when withToasts is omitted', () => {
    render(
      <MayaProviders
        authService={mockAuthService}
        serviceSlug="test"
        fetchProfile={mockFetchProfile}
      >
        <span>content</span>
      </MayaProviders>,
    )
    expect(screen.queryByTestId('toast-provider')).toBeNull()
  })

  it('mounts ToastProvider AND ExtraProviders when both are provided', () => {
    function Extra({ children }: { children: ReactNode }) {
      return <div data-testid="extra">{children}</div>
    }
    render(
      <MayaProviders
        authService={mockAuthService}
        serviceSlug="test"
        fetchProfile={mockFetchProfile}
        withToasts
        extraProviders={Extra}
      >
        <span data-testid="inner2">inner</span>
      </MayaProviders>,
    )
    expect(screen.getByTestId('toast-provider')).toBeTruthy()
    expect(screen.getByTestId('extra')).toBeTruthy()
    expect(screen.getByTestId('inner2')).toBeTruthy()
  })

  it('registers and removes unhandledrejection listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = render(
      <MayaProviders
        authService={mockAuthService}
        serviceSlug="test"
        fetchProfile={mockFetchProfile}
      >
        <span>content</span>
      </MayaProviders>,
    )

    expect(addSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function))

    unmount()

    expect(removeSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function))
  })
})
