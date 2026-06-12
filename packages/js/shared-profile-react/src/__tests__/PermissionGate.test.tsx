import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { PermissionGate } from '../PermissionGate'

// Mock useUserProfile with different states
const mockUseUserProfile = vi.hoisted(() => vi.fn())

vi.mock('../UserProfileContext', () => ({
  useUserProfile: mockUseUserProfile,
}))

describe('PermissionGate', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('shows skeleton/loading indicator while loading (block mode)', () => {
      mockUseUserProfile.mockReturnValue({ loading: true, hasPermission: () => false })
      render(
        <PermissionGate permission="test.read" mode="block">
          <div>Protected content</div>
        </PermissionGate>,
      )
      // Should show loading state, not content
      expect(screen.queryByText('Protected content')).toBeNull()
    })

    it('shows nothing while loading (hide mode)', () => {
      mockUseUserProfile.mockReturnValue({ loading: true, hasPermission: () => false })
      const { container } = render(
        <PermissionGate permission="test.read" mode="hide">
          <div>Protected content</div>
        </PermissionGate>,
      )
      expect(screen.queryByText('Protected content')).toBeNull()
      expect(container.firstChild).toBeNull()
    })
  })

  describe('access granted', () => {
    it('renders children when permission is granted (block mode)', () => {
      mockUseUserProfile.mockReturnValue({ loading: false, hasPermission: () => true })
      render(
        <PermissionGate permission="test.read" mode="block">
          <div>Protected content</div>
        </PermissionGate>,
      )
      expect(screen.getByText('Protected content')).toBeTruthy()
    })

    it('renders children when permission is granted (hide mode)', () => {
      mockUseUserProfile.mockReturnValue({ loading: false, hasPermission: () => true })
      render(
        <PermissionGate permission="test.read" mode="hide">
          <div>Protected content</div>
        </PermissionGate>,
      )
      expect(screen.getByText('Protected content')).toBeTruthy()
    })
  })

  describe('access denied', () => {
    it('shows denied alert (block mode) — does not render children', () => {
      mockUseUserProfile.mockReturnValue({ loading: false, hasPermission: () => false })
      render(
        <PermissionGate permission="test.read" mode="block">
          <div>Protected content</div>
        </PermissionGate>,
      )
      expect(screen.queryByText('Protected content')).toBeNull()
      expect(screen.getByRole('alert')).toBeTruthy()
    })

    it('hides everything when denied (hide mode)', () => {
      mockUseUserProfile.mockReturnValue({ loading: false, hasPermission: () => false })
      const { container } = render(
        <PermissionGate permission="test.read" mode="hide">
          <div>Protected content</div>
        </PermissionGate>,
      )
      expect(screen.queryByText('Protected content')).toBeNull()
      expect(container.firstChild).toBeNull()
    })

    it('uses custom denied message label when provided', () => {
      mockUseUserProfile.mockReturnValue({ loading: false, hasPermission: () => false })
      render(
        <PermissionGate
          permission="test.read"
          mode="block"
          deniedMessage="No tienes acceso a esta sección"
        >
          <div>Protected content</div>
        </PermissionGate>,
      )
      expect(screen.getByText('No tienes acceso a esta sección')).toBeTruthy()
    })

    it('shows default Spanish denied message when no custom message provided', () => {
      mockUseUserProfile.mockReturnValue({ loading: false, hasPermission: () => false })
      render(
        <PermissionGate permission="test.read" mode="block">
          <div>Protected content</div>
        </PermissionGate>,
      )
      // Alert should have some text content — exact default wording
      const alert = screen.getByRole('alert')
      expect(alert.textContent).toBeTruthy()
    })

    it('renders custom fallback when provided in hide mode', () => {
      mockUseUserProfile.mockReturnValue({ loading: false, hasPermission: () => false })
      render(
        <PermissionGate
          permission="test.read"
          mode="hide"
          fallback={<div>Fallback content</div>}
        >
          <div>Protected content</div>
        </PermissionGate>,
      )
      expect(screen.queryByText('Protected content')).toBeNull()
      expect(screen.getByText('Fallback content')).toBeTruthy()
    })
  })
})
