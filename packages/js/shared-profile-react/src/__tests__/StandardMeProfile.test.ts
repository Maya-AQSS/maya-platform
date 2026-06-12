import { describe, expect, it } from 'vitest'
import type { StandardMeProfile } from '../StandardMeProfile'
import type { BaseMeProfile } from '../types'

describe('StandardMeProfile', () => {
  it('is assignable from a full profile object', () => {
    const profile: StandardMeProfile = {
      id: 'abc',
      email: 'user@test.com',
      name: 'User Name',
      locale: 'es',
      first_name: 'User',
      last_name: 'Name',
      username: 'username',
      scope: 'user',
    }
    expect(profile.scope).toBe('user')
    expect(profile.first_name).toBe('User')
    expect(profile.last_name).toBe('Name')
    expect(profile.username).toBe('username')
  })

  it('allows null first_name, last_name, and username', () => {
    const profile: StandardMeProfile = {
      id: 'abc',
      email: 'user@test.com',
      name: null,
      locale: 'es',
      first_name: null,
      last_name: null,
      username: null,
      scope: 'all',
    }
    expect(profile.first_name).toBeNull()
    expect(profile.last_name).toBeNull()
    expect(profile.username).toBeNull()
  })

  it('extends BaseMeProfile', () => {
    const profile: StandardMeProfile = {
      id: 'abc',
      email: 'user@test.com',
      name: 'Test',
      locale: 'es',
      first_name: null,
      last_name: null,
      username: null,
      scope: 'user',
    }
    // Can assign to BaseMeProfile
    const base: BaseMeProfile = profile
    expect(base.id).toBe('abc')
  })
})
