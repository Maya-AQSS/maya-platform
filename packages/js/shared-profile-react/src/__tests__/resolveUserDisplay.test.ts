import { describe, expect, it } from 'vitest'
import { resolveUserDisplay } from '../resolveUserDisplay'
import type { BaseMeProfile } from '../types'

const baseProfile: BaseMeProfile = {
  id: '1',
  email: 'user@example.com',
  name: 'Ana García',
  locale: 'es',
}

describe('resolveUserDisplay', () => {
  it('returns name from profile.name', () => {
    const result = resolveUserDisplay(baseProfile)
    expect(result.userName).toBe('Ana García')
  })

  it('returns initials from profileDisplayInitials', () => {
    const result = resolveUserDisplay(baseProfile)
    expect(result.userInitials).toBe('AG')
  })

  it('returns email from profile.email', () => {
    const result = resolveUserDisplay(baseProfile)
    expect(result.userEmail).toBe('user@example.com')
  })

  it('falls back to tokenUser.name when profile is null', () => {
    const result = resolveUserDisplay(null, { name: 'Pedro López' })
    expect(result.userName).toBe('Pedro López')
  })

  it('falls back to tokenUser.preferred_username when profile and name are null', () => {
    const result = resolveUserDisplay(null, { preferred_username: 'pedro.l' })
    expect(result.userName).toBe('pedro.l')
  })

  it('computes initials from token name when profile is null', () => {
    const result = resolveUserDisplay(null, { name: 'Pedro López' })
    expect(result.userInitials).toBe('PL')
  })

  it('falls back to U for initials when no profile and no token', () => {
    const result = resolveUserDisplay(null)
    expect(result.userInitials).toBe('U')
  })

  it('falls back to tokenUser.email when profile email is null', () => {
    const profileNoEmail: BaseMeProfile = { ...baseProfile, email: null }
    const result = resolveUserDisplay(profileNoEmail, { email: 'token@example.com' })
    expect(result.userEmail).toBe(null) // profile email dominates even if null
  })

  it('falls back to tokenUser.email when profile is null', () => {
    const result = resolveUserDisplay(null, { email: 'token@example.com' })
    expect(result.userEmail).toBe('token@example.com')
  })

  it('handles profile with no name, uses email as base for initials', () => {
    const profileNoName: BaseMeProfile = { ...baseProfile, name: null }
    const result = resolveUserDisplay(profileNoName)
    expect(result.userName).toBe('')
    expect(result.userInitials).toBe('US') // first 2 chars of email
  })

  it('returns empty userEmail when no profile and no token email', () => {
    const result = resolveUserDisplay(null, { name: 'Solo Nombre' })
    expect(result.userEmail).toBeUndefined()
  })

  it('prefers profile over token for all fields', () => {
    const result = resolveUserDisplay(baseProfile, {
      name: 'Token Name',
      preferred_username: 'tokenuser',
      email: 'token@example.com',
    })
    expect(result.userName).toBe('Ana García')
    expect(result.userEmail).toBe('user@example.com')
  })
})
