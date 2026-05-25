import type { HTMLAttributes, ReactNode } from 'react'

type DivProps = HTMLAttributes<HTMLDivElement>

/**
 * Tarjeta compuesta con sub-componentes:
 *   <Card>
 *     <Card.Header>
 *       <Card.Title>Título</Card.Title>
 *       <Card.Actions><Button>...</Button></Card.Actions>
 *     </Card.Header>
 *     <Card.Body>contenido</Card.Body>
 *     <Card.Footer>...</Card.Footer>
 *   </Card>
 *
 * Diseñada para superficies sobre `bg-ui-body`/`bg-ui-dark-bg`. La variante
 * `interactive` añade hover y `cursor-pointer` para tarjetas clicables.
 */
type CardProps = DivProps & {
  /** Cuando `true`, añade hover y `cursor-pointer`. */
  interactive?: boolean
  /** Padding del contenedor (gestionado normalmente por sub-componentes; default `none`). */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Radio de la tarjeta. Default `xl` (16px). `2xl` (24px) para hero/dashboard. */
  radius?: 'lg' | 'xl' | '2xl'
  /** Aplica fondo glass (translúcido + blur). Para superficies destacadas en dashboards. */
  glass?: boolean
  /** Sombra elevada con tinte morado. */
  float?: boolean
}

const paddingClass: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const radiusClass: Record<NonNullable<CardProps['radius']>, string> = {
  lg: 'rounded-lg',
  xl: 'rounded-2xl',
  '2xl': 'rounded-3xl',
}

function CardRoot({
  interactive = false,
  padding = 'none',
  radius = 'xl',
  glass = false,
  float = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  const surface = glass
    ? 'bg-card-glass border border-white/40 dark:border-white/8'
    : 'bg-card-tinted dark:bg-card-tinted border border-ui-border-l dark:border-ui-dark-border-l'
  const shadow = float
    ? 'shadow-[0_24px_48px_-16px_rgba(15,23,42,0.18),0_8px_16px_-8px_rgba(113,75,103,0.18)]'
    : 'shadow-card'
  const base = `${surface} ${shadow} ${radiusClass[radius]} overflow-hidden`
  const interactiveCls = interactive
    ? 'motion-safe:transition-all motion-safe:duration-200 ease-out hover:border-odoo-purple/30 dark:hover:border-odoo-dark-purple/40 hover:shadow-card-md motion-safe:hover:-translate-y-0.5 cursor-pointer focus-within:ring-2 focus-within:ring-odoo-purple/30 focus-within:ring-offset-2 focus-within:ring-offset-ui-body dark:focus-within:ring-offset-ui-dark-bg'
    : ''
  const merged = `${base} ${interactiveCls} ${paddingClass[padding]} ${className}`.trim()
  return (
    <div className={merged} {...rest}>
      {children}
    </div>
  )
}

function CardHeader({ className = '', children, ...rest }: DivProps) {
  return (
    <div
      className={`px-4 py-3 border-b border-ui-border-l dark:border-ui-dark-border-l flex items-center justify-between gap-3 ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  )
}

function CardTitle({ children, className = '', ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-base font-bold text-text-primary dark:text-text-dark-primary tracking-tight font-display ${className}`.trim()}
      {...rest}
    >
      {children}
    </h3>
  )
}

function CardActions({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex items-center gap-2 ${className}`.trim()}>{children}</div>
}

function CardBody({ className = '', children, ...rest }: DivProps) {
  return (
    <div className={`px-4 py-4 ${className}`.trim()} {...rest}>
      {children}
    </div>
  )
}

function CardFooter({ className = '', children, ...rest }: DivProps) {
  return (
    <div
      className={`px-4 py-3 border-t border-ui-border-l dark:border-ui-dark-border-l bg-ui-body/40 dark:bg-ui-dark-bg/40 flex items-center justify-end gap-2 ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  )
}

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Actions: CardActions,
  Body: CardBody,
  Footer: CardFooter,
})
