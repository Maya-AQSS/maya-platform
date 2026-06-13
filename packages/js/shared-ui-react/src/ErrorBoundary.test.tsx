import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createInstance } from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import type { ReactNode } from 'react'
import { createI18nErrorBoundary } from './ErrorBoundary'

const i18n = createInstance()
void i18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['common'],
  defaultNS: 'common',
  resources: {
    es: { common: { errors: { componentLoad: 'No se pudo cargar' } } },
  },
  interpolation: { escapeValue: false },
})

function Boom(): ReactNode {
  throw new Error('boom')
}

function renderWithI18n(ui: ReactNode) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

describe('createI18nErrorBoundary', () => {
  // React logs caught render errors to console.error; silence the noise.
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}))
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders children when there is no error', () => {
    const Boundary = createI18nErrorBoundary()
    renderWithI18n(<Boundary>
      <span>healthy</span>
    </Boundary>)
    expect(screen.getByText('healthy')).toBeTruthy()
  })

  it('renders the i18n default fallback when a child throws', () => {
    const Boundary = createI18nErrorBoundary()
    renderWithI18n(<Boundary>
      <Boom />
    </Boundary>)
    expect(screen.getByText('No se pudo cargar')).toBeTruthy()
  })

  it('renders a custom fallback when provided', () => {
    const Boundary = createI18nErrorBoundary()
    renderWithI18n(<Boundary fallback={<span>custom fallback</span>}>
      <Boom />
    </Boundary>)
    expect(screen.getByText('custom fallback')).toBeTruthy()
  })
})
