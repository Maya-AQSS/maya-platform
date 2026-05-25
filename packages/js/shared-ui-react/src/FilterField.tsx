import type { ReactNode } from 'react'

type Props = {
  /** Texto del label (uppercase). */
  label: ReactNode
  /** Si true, el label es solo accesible (sr-only). */
  hideLabel?: boolean
  /** Asocia el label con un control concreto vía `htmlFor`. */
  htmlFor?: string
  /** Control a renderizar (TextInput, MultiSelect, DatePicker, etc.). */
  children: ReactNode
  className?: string
}

/**
 * Field wrapper para paneles de filtros (`<DataTable filtersPanel={...}>`).
 *
 * Encapsula el patrón label-uppercase + control que se repite en authz/dms/logs.
 * Para el control, pasa cualquier hijo: `<TextInput>`, `<MultiSelect>`, etc.
 *
 * @example
 *   <FilterField label="Buscar" htmlFor="q">
 *     <TextInput id="q" type="search" value={q} onChange={...} />
 *   </FilterField>
 */
export function FilterField({ label, hideLabel = false, htmlFor, children, className = '' }: Props) {
  const labelBase =
    'text-text-secondary dark:text-text-dark-secondary text-xs font-medium uppercase tracking-wide'
  return (
    <div className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
      <label
        htmlFor={htmlFor}
        className={hideLabel ? 'sr-only' : labelBase}
      >
        {label}
      </label>
      {children}
    </div>
  )
}
