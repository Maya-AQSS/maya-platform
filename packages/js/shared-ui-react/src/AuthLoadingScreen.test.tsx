import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { AuthLoadingScreen } from './AuthLoadingScreen'

describe('AuthLoadingScreen', () => {
  afterEach(cleanup)

  it('renders the message inside the loading screen', () => {
    render(<AuthLoadingScreen message="Cargando..." />)
    expect(screen.getByText('Cargando...')).toBeTruthy()
  })

  it('renders a different message when passed', () => {
    render(<AuthLoadingScreen message="Redirigiendo al login" />)
    expect(screen.getByText('Redirigiendo al login')).toBeTruthy()
  })

  it('uses the expected Tailwind classes for full-screen centering', () => {
    const { container } = render(<AuthLoadingScreen message="Test" />)
    const div = container.firstElementChild as HTMLElement
    expect(div.className).toContain('flex')
    expect(div.className).toContain('items-center')
    expect(div.className).toContain('justify-center')
    expect(div.className).toContain('h-screen')
  })

  it('renders empty message without error', () => {
    render(<AuthLoadingScreen message="" />)
    // Should not throw
  })
})
