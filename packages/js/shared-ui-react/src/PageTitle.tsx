import type { ReactNode } from 'react'
import { BackButton } from './BackButton'

type Props = {
  title: ReactNode
  /** Subtítulo descriptivo opcional (centrado bajo el título). */
  subtitle?: ReactNode
  /** Acción/es a la derecha (botones, selectores). */
  actions?: ReactNode
  /** Si se aporta, muestra una flecha de volver a la izquierda del título. */
  onBack?: () => void
  /** Texto accesible del botón volver. Default: i18n `actions.back` ("Volver"). */
  backLabel?: string
  /** Si se aporta, se inserta como bloque adicional (filtros, tabs) bajo título. */
  meta?: ReactNode
  className?: string
  /**
   * Imagen de cabecera centrada que sustituye al texto del título. El texto
   * de `title` se mantiene como `<h1>` visualmente oculto (SEO/a11y) y como
   * fallback `alt` si no se aporta uno explícito. Tamaño y estilo definidos
   * en la clase CSS `.maya-page-title-image` (alto máximo 150 px).
   */
  image?: {
    src: string
    /** Texto alternativo accesible. Si se omite, se usa el `title` como string. */
    alt?: string
  }
  /** @deprecated El título siempre está centrado horizontalmente. */
  centerOnMobile?: boolean
}

/**
 * Encabezado de página con tres zonas:
 *   ┌──────────────┬─────────────────────────┬──────────────┐
 *   │ [← volver?]  │   Título centrado       │  [acciones?] │
 *   │              │   subtítulo opcional    │              │
 *   └──────────────┴─────────────────────────┴──────────────┘
 *
 *   <PageTitle title="Roles" actions={<Button>+ Nuevo</Button>} />
 *   <PageTitle title="Detalle" onBack={() => navigate(-1)} />
 */
export function PageTitle({
  title,
  subtitle,
  actions,
  onBack,
  backLabel,
  meta,
  image,
  className = '',
}: Props) {
  const altText = image?.alt ?? (typeof title === 'string' ? title : '')
  return (
    <header className={`w-full mb-6 ${className}`.trim()}>
      {/*
        Layout: el título está absolutamente centrado respecto al ancho total
        del header, así su posición no depende del tamaño de las acciones.
        Las acciones y el botón de volver flotan a los lados con z-10.
      */}
      <div className="relative flex items-center justify-center min-h-[2.5rem]">
        {onBack ? (
          <BackButton
            onClick={onBack}
            label={backLabel}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
          />
        ) : null}

        <div className="min-w-0 max-w-full px-12 sm:px-16 text-center">
          {image ? (
            <>
              <img
                src={image.src}
                alt={altText}
                className="maya-page-title-image"
              />
              {/* Mantiene el h1 para SEO/lectores de pantalla aunque la imagen
                  ya transmite la identidad visual. */}
              <h1 className="sr-only">{title}</h1>
            </>
          ) : (
            <h1
              className={[
                'm-0 font-display font-extrabold tracking-tight leading-tight',
                'text-2xl md:text-3xl',
                'text-text-primary dark:text-text-dark-primary',
                'truncate',
              ].join(' ')}
            >
              {title}
            </h1>
          )}
          {subtitle ? (
            <p className="mt-1 text-sm text-text-secondary dark:text-text-dark-secondary">
              {subtitle}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex shrink-0 items-center justify-end gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      {meta ? <div className="mt-4">{meta}</div> : null}
    </header>
  )
}
