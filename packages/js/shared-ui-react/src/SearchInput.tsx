import { useEffect, useState } from 'react'

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  /** Etiqueta visible (si se omite y `hideLabel` es false, no se renderiza). */
  label?: string
  /** Etiqueta por defecto usada cuando no se pasa `label`. */
  defaultLabel?: string
  hideLabel?: boolean
  placeholder?: string
  /** Placeholder por defecto usado cuando no se pasa `placeholder`. */
  defaultPlaceholder?: string
  ariaLabel?: string
  debounceMs?: number
  disabled?: boolean
}

export function SearchInput({
  value,
  onChange,
  label,
  defaultLabel,
  hideLabel = false,
  placeholder,
  defaultPlaceholder,
  ariaLabel,
  debounceMs = 300,
  disabled,
}: SearchInputProps) {
  const resolvedLabel = label ?? defaultLabel
  const resolvedPlaceholder = placeholder ?? defaultPlaceholder
  const [local, setLocal] = useState(value)

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    if (local === value) return
    const handle = setTimeout(() => onChange(local), debounceMs)
    return () => clearTimeout(handle)
  }, [local, value, onChange, debounceMs])

  return (
    <div>
      {!hideLabel && resolvedLabel && (
        <label className="mb-1 block text-xs font-semibold text-text-secondary dark:text-text-dark-secondary">
          {resolvedLabel}
        </label>
      )}
      <input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={resolvedPlaceholder}
        aria-label={ariaLabel ?? resolvedLabel}
        disabled={disabled}
        className="w-full rounded-lg border border-ui-border bg-ui-card px-3 py-2 text-sm shadow-sm dark:border-ui-dark-border dark:bg-ui-dark-card dark:text-text-dark-primary focus:border-odoo-purple focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  )
}
