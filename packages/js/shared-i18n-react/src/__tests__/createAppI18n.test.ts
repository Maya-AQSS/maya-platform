import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock shared-auth-react before importing createAppI18n
vi.mock('@ceedcv-maya/shared-auth-react', () => ({
  readOverrides: () => null,
}))

// Mock i18next-browser-languagedetector
vi.mock('i18next-browser-languagedetector', () => ({
  default: {
    type: '3rdParty',
    init: vi.fn(),
    detect: vi.fn(() => 'es'),
    cacheUserLanguage: vi.fn(),
  },
}))

describe('createAppI18n', () => {
  beforeEach(() => {
    // Reset localStorage between tests
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
  })

  it('exports createAppI18n function', async () => {
    const mod = await import('../createAppI18n')
    expect(typeof mod.createAppI18n).toBe('function')
  })

  it('returns an object with an i18n instance', async () => {
    const { createAppI18n } = await import('../createAppI18n')
    const resources = { es: { common: { hello: 'Hola' } } }
    const { i18n } = createAppI18n(resources, ['common'])
    expect(i18n).toBeDefined()
    expect(typeof i18n.changeLanguage).toBe('function')
  })

  it('returns a changeLocale function bound to the instance', async () => {
    const { createAppI18n } = await import('../createAppI18n')
    const resources = { es: { common: { hello: 'Hola' } } }
    const { changeLocale } = createAppI18n(resources, ['common'])
    expect(typeof changeLocale).toBe('function')
  })

  it('changeLocale delegates to i18n.changeLanguage', async () => {
    const { createAppI18n } = await import('../createAppI18n')
    const resources = { es: { common: { hello: 'Hola' } } }
    const { i18n, changeLocale } = createAppI18n(resources, ['common'])
    const spy = vi.spyOn(i18n, 'changeLanguage').mockResolvedValue(vi.fn() as never)

    await changeLocale('en')

    expect(spy).toHaveBeenCalledWith('en')
    spy.mockRestore()
  })

  it('accepts optional i18next options', async () => {
    const { createAppI18n } = await import('../createAppI18n')
    const resources = { es: { common: { hello: 'Hola' } } }
    // Should not throw with extra options
    const { i18n } = createAppI18n(resources, ['common'], { debug: false })
    expect(i18n).toBeDefined()
  })

  // Ruta de export única: las constantes de locale se exponen desde ./config
  // (re-exportadas por el index del paquete), no desde createAppI18n.
  it('exposes DEFAULT_LOCALE from the package config module', async () => {
    const mod = await import('../config')
    expect(mod.DEFAULT_LOCALE).toBe('es')
  })

  it('exposes SUPPORTED_LOCALES from the package config module', async () => {
    const mod = await import('../config')
    expect(Array.isArray(mod.SUPPORTED_LOCALES)).toBe(true)
    expect(mod.SUPPORTED_LOCALES).toContain('es')
    expect(mod.SUPPORTED_LOCALES).toContain('va')
    expect(mod.SUPPORTED_LOCALES).toContain('en')
  })
})
