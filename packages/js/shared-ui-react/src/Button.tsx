import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'teal'
  /** Borde neutro (editar, cancelar). */
  | 'outline'
  /** Borde teal (clonar). */
  | 'outlineTeal'
  /** Borde advertencia (eliminar en fila). */
  | 'outlineWarning'
  /** Solo texto enlazado (p. ej. ✕, "Cerrar" en línea). */
  | 'ghost'
  /** Sin estilos de superficie; usar `className` (backdrop, nav, icono). */
  | 'unstyled'

export type ButtonSize = 'xs' | 'sm' | 'md'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  /** Opcional si el botón solo usa `aria-label` (p. ej. backdrop). */
  children?: ReactNode
}

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-odoo-purple/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ui-card dark:focus-visible:ring-offset-ui-dark-card'

const sizeClass: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-xs font-semibold rounded-md',
  sm: 'px-4 py-1.5 text-sm font-semibold rounded-md',
  md: 'px-5 py-2 text-sm font-semibold rounded-md',
}

// Pulido estético: micro-interacciones (hover lift, sombras suaves) respetando prefers-reduced-motion.
const liftMotion =
  'motion-safe:transition-all motion-safe:duration-150 motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0'

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-primary bg-gradient-primary-hover text-text-inverse border border-odoo-purple-d dark:border-odoo-dark-purple shadow-[0_2px_6px_-2px_rgba(113,75,103,0.45)] hover:shadow-[0_8px_18px_-6px_rgba(113,75,103,0.55)] active:shadow-[0_1px_2px_-1px_rgba(113,75,103,0.4)] motion-reduce:bg-odoo-purple motion-reduce:dark:bg-odoo-dark-purple',
  secondary:
    'border border-ui-border dark:border-ui-dark-border bg-ui-card dark:bg-ui-dark-card text-text-primary dark:text-text-dark-primary hover:bg-white dark:hover:bg-ui-dark-bg hover:border-odoo-purple/30 dark:hover:border-odoo-dark-purple/40 hover:shadow-[0_4px_10px_-6px_rgba(15,23,42,0.18)]',
  danger:
    'bg-danger text-text-inverse border border-danger shadow-[0_2px_6px_-2px_rgba(220,38,38,0.4)] hover:bg-danger/90 hover:shadow-[0_6px_14px_-4px_rgba(220,38,38,0.5)] active:bg-danger/90 active:shadow-[0_1px_2px_-1px_rgba(220,38,38,0.4)]',
  teal:
    'bg-odoo-teal text-text-inverse border border-odoo-teal shadow-[0_2px_6px_-2px_rgba(17,164,156,0.4)] hover:bg-odoo-teal-d hover:shadow-[0_6px_14px_-4px_rgba(17,164,156,0.5)] active:bg-odoo-teal-d',
  outline:
    'border border-ui-border dark:border-ui-dark-border text-text-secondary dark:text-text-dark-secondary hover:bg-ui-body dark:hover:bg-ui-dark-bg hover:border-text-secondary/60 dark:hover:border-text-dark-secondary/50 hover:text-text-primary dark:hover:text-text-dark-primary',
  outlineTeal:
    'border border-odoo-teal/40 text-odoo-teal hover:bg-odoo-teal/10 hover:border-odoo-teal hover:shadow-[0_3px_10px_-4px_rgba(17,164,156,0.35)]',
  outlineWarning:
    'border border-warning/40 text-warning-dark hover:bg-warning-light/30 dark:hover:bg-warning-dark/15 hover:border-warning hover:shadow-[0_3px_10px_-4px_rgba(245,158,11,0.4)]',
  ghost:
    'bg-transparent text-text-secondary dark:text-text-dark-secondary border border-transparent hover:border-ui-border dark:hover:border-ui-dark-border hover:text-text-primary dark:hover:text-text-dark-primary hover:bg-ui-body/60 dark:hover:bg-ui-dark-bg/60',
  unstyled: '',
}

function spinnerClass(variant: ButtonVariant): string {
  if (
    variant === 'secondary' ||
    variant === 'outline' ||
    variant === 'outlineTeal' ||
    variant === 'outlineWarning' ||
    variant === 'ghost' ||
    variant === 'unstyled'
  ) {
    return 'border-text-primary/35 border-t-text-primary dark:border-text-dark-primary/35 dark:border-t-text-dark-primary'
  }
  return 'border-text-inverse/30 border-t-text-inverse'
}

/**
 * Botón reutilizable alineado con Maya / Odoo (variantes sólidas, contorno y ghost).
 */
export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    type = 'button',
    variant = 'primary',
    size = 'sm',
    loading = false,
    disabled,
    className = '',
    children,
    ...rest
  },
  ref,
) {
  // ghost respeta el size como cualquier otra variante (padding consistente).
  // unstyled no aplica ningún tamaño (el consumidor define todo).
  const sizeStyles = variant === 'unstyled' ? '' : sizeClass[size]
  const layoutClass =
    variant === 'unstyled'
      ? 'inline-flex'
      : 'inline-flex items-center justify-center gap-2'
  const motion = variant === 'unstyled' || variant === 'ghost' ? '' : liftMotion
  // Disabled: gris neutro (no color desvaído). Evita que un "Eliminar" disabled
  // luzca rosa y se confunda con un estado activo distinto.
  // Disabled legible: texto con contraste suficiente para leerse (no `text-muted`
  // ni `saturate-0`, que dejan el label casi invisible).
  const disabledClass =
    variant === 'unstyled'
      ? 'disabled:pointer-events-none disabled:opacity-60'
      : 'disabled:pointer-events-none disabled:bg-none disabled:bg-text-muted/10 dark:disabled:bg-text-dark-muted/10 disabled:text-text-secondary dark:disabled:text-text-dark-secondary disabled:border-text-muted/30 dark:disabled:border-text-dark-muted/30 disabled:shadow-none'
  const base = `${layoutClass} transition-colors ${disabledClass} ${focusRing} ${motion} ${sizeStyles} ${variantClass[variant]}`
  const merged = className ? `${base} ${className}` : base

  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={merged} {...rest}>
      {loading ? (
        <span
          className={`size-3 shrink-0 animate-spin rounded-full border-2 ${spinnerClass(variant)}`}
          aria-hidden
        />
      ) : null}
      {children ?? null}
    </button>
  )
})
