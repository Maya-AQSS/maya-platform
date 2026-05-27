import { useEffect, useState } from 'react'

/**
 * Debounces a value: returns the latest value only after `delay` ms of silence.
 *
 * @example
 *   const debouncedSearch = useDebounce(searchInput, 400)
 *   // use debouncedSearch to trigger queries — only fires when the user stops typing
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
