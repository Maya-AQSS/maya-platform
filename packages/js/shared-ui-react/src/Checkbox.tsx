import { useEffect, useRef, type InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'checked' | 'value'> & {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Etiqueta a la derecha del checkbox. Se convierte en texto clicable. */
  label?: string
  /** Texto secundario debajo del label (mismo color que muted). */
  description?: string
  /** Estado indeterminate (tri-estado). Se aplica vía `ref.indeterminate`. */
  indeterminate?: boolean
}

const BOX_CLASS =
  'h-4 w-4 shrink-0 rounded border border-ui-border bg-ui-card text-odoo-purple shadow-sm accent-odoo-purple ' +
  'focus:outline-none focus:ring-2 focus:ring-odoo-purple/30 ' +
  'dark:border-ui-dark-border dark:bg-ui-dark-card ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  indeterminate = false,
  disabled,
  className = '',
  id,
  ...rest
}: Props) {
  const ref = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])

  const input = (
    <input
      ref={ref}
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className={`${BOX_CLASS} ${className}`.trim()}
      {...rest}
    />
  )

  if (!label && !description) return input

  return (
    <label
      className={`inline-flex items-start gap-2 text-sm text-text-primary dark:text-text-dark-primary ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      }`}
    >
      {input}
      <span className="flex flex-col leading-tight">
        {label && <span className="select-none">{label}</span>}
        {description && (
          <span className="text-xs text-text-muted dark:text-text-dark-muted">{description}</span>
        )}
      </span>
    </label>
  )
}
