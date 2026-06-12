import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, act } from '@testing-library/react'
import { SearchInput } from './SearchInput'

describe('SearchInput', () => {
  afterEach(cleanup)

  it('renders an input of type search', () => {
    render(<SearchInput value="" onChange={() => {}} />)
    expect(screen.getByRole('searchbox')).toBeTruthy()
  })

  it('uses defaultLabel when label prop is not provided', () => {
    render(<SearchInput value="" onChange={() => {}} defaultLabel="Buscar registros" />)
    expect(screen.getByText('Buscar registros')).toBeTruthy()
  })

  it('uses defaultPlaceholder when placeholder prop is not provided', () => {
    render(<SearchInput value="" onChange={() => {}} defaultPlaceholder="Escribe para buscar..." />)
    const input = screen.getByRole('searchbox')
    expect(input.getAttribute('placeholder')).toBe('Escribe para buscar...')
  })

  it('explicit label overrides defaultLabel', () => {
    render(
      <SearchInput
        value=""
        onChange={() => {}}
        label="Label explícito"
        defaultLabel="Label por defecto"
      />,
    )
    expect(screen.getByText('Label explícito')).toBeTruthy()
    expect(screen.queryByText('Label por defecto')).toBeNull()
  })

  it('explicit placeholder overrides defaultPlaceholder', () => {
    render(
      <SearchInput
        value=""
        onChange={() => {}}
        placeholder="Placeholder explícito"
        defaultPlaceholder="Placeholder por defecto"
      />,
    )
    const input = screen.getByRole('searchbox')
    expect(input.getAttribute('placeholder')).toBe('Placeholder explícito')
  })

  it('existing callers without defaultLabel/defaultPlaceholder still work', () => {
    render(<SearchInput value="" onChange={() => {}} />)
    const input = screen.getByRole('searchbox')
    expect(input).toBeTruthy()
    // No label rendered by default
    expect(screen.queryByRole('label')).toBeNull()
  })

  it('calls onChange with debounce', async () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    render(<SearchInput value="" onChange={onChange} debounceMs={100} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'hola' } })
    expect(onChange).not.toHaveBeenCalled()
    await act(async () => { vi.advanceTimersByTime(150) })
    expect(onChange).toHaveBeenCalledWith('hola')
    vi.useRealTimers()
  })
})
