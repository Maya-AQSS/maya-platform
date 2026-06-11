import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createInstance } from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import type { ReactNode } from 'react'
import { BackButton } from './BackButton'

const i18n = createInstance()
void i18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['common'],
  defaultNS: 'common',
  resources: {
    es: { common: { actions: { back: 'Volver' } } },
  },
  interpolation: { escapeValue: false },
})

function renderWithI18n(ui: ReactNode) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

describe('BackButton', () => {
  afterEach(cleanup)

  it('renders the icon variant with the i18n default label as aria-label', () => {
    renderWithI18n(<BackButton onClick={() => {}} />)
    const button = screen.getByRole('button', { name: 'Volver' })
    expect(button).toBeTruthy()
    expect(button.getAttribute('title')).toBe('Volver')
    // Variante icono: sin texto visible, solo el SVG.
    expect(button.textContent).toBe('')
    expect(button.querySelector('svg')).toBeTruthy()
  })

  it('fires onClick when pressed', () => {
    const onClick = vi.fn()
    renderWithI18n(<BackButton onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('honours a custom label', () => {
    renderWithI18n(<BackButton onClick={() => {}} label="Volver a Temas" />)
    expect(screen.getByRole('button', { name: 'Volver a Temas' })).toBeTruthy()
  })

  it('renders the outline variant with a visible text label', () => {
    renderWithI18n(<BackButton onClick={() => {}} variant="outline" />)
    const button = screen.getByRole('button', { name: 'Volver' })
    expect(button.textContent).toContain('Volver')
    expect(button.querySelector('svg')).toBeTruthy()
  })

  it('renders the ghost variant with a visible text label', () => {
    renderWithI18n(<BackButton onClick={() => {}} variant="ghost" label="Volver a Plantillas" />)
    const button = screen.getByRole('button', { name: 'Volver a Plantillas' })
    expect(button.textContent).toContain('Volver a Plantillas')
  })

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn()
    renderWithI18n(<BackButton onClick={onClick} disabled />)
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})
