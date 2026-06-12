import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AppErrorFallback } from './AppErrorFallback'

describe('AppErrorFallback', () => {
  afterEach(cleanup)

  it('renders the default Spanish heading', () => {
    render(<AppErrorFallback />)
    expect(screen.getByRole('heading')).toBeTruthy()
    expect(screen.getByRole('heading').textContent).toContain('error')
  })

  it('renders the default secondary text', () => {
    render(<AppErrorFallback />)
    expect(screen.getByText(/Por favor, recarga/i)).toBeTruthy()
  })

  it('renders the reload button', () => {
    render(<AppErrorFallback />)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('calls window.location.reload when button is clicked', () => {
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    })

    render(<AppErrorFallback />)
    fireEvent.click(screen.getByRole('button'))
    expect(reloadMock).toHaveBeenCalledTimes(1)
  })

  it('renders a custom heading when provided', () => {
    render(<AppErrorFallback heading="Algo salió mal" />)
    expect(screen.getByRole('heading').textContent).toContain('Algo salió mal')
  })

  it('renders a custom description when provided', () => {
    render(<AppErrorFallback description="Contacta con IT" />)
    expect(screen.getByText('Contacta con IT')).toBeTruthy()
  })

  it('renders a custom button label when provided', () => {
    render(<AppErrorFallback reloadLabel="Intentar de nuevo" />)
    expect(screen.getByRole('button').textContent).toContain('Intentar de nuevo')
  })
})
