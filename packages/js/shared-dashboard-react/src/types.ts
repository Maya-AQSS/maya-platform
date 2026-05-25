import type { ComponentType } from 'react'

/** Posición y tamaño de un widget en la rejilla. */
export interface LayoutItem {
  /** id del widget — debe coincidir con la clave en el `WidgetRegistry`. */
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}

/** Definición de un widget reutilizable. */
export interface WidgetDefinition {
  /** id estable. */
  id: string
  /** Clave i18n para el título (resuelta por el consumidor con su `t`). */
  titleKey: string
  /** Si true, oculta la barra de título del frame. */
  hideTitle?: boolean
  /**
   * Realza el widget con borde gradiente (purple → teal). Reservar para
   * KPIs hero (1-2 por dashboard máximo).
   */
  highlight?: boolean
  /**
   * Si true, el frame deja crecer su contenido fuera del card (`overflow:visible`).
   * Útil cuando el widget renderiza decoraciones que deben sobresalir
   * (megáfono, marcadores). Por defecto false — el frame recorta.
   */
  allowOverflow?: boolean
  /**
   * Si true, el frame no aplica padding interno al contenedor de children.
   * El widget controla su propio espaciado — necesario para fondos a sangre
   * que llegan hasta el borde del card.
   */
  bleed?: boolean
  /** Tamaño por defecto al añadir el widget. */
  defaultSize: { w: number; h: number }
  /** Tamaño mínimo al redimensionar. */
  minSize: { w: number; h: number }
  /** Componente React que renderiza el contenido del widget. */
  component: ComponentType<Record<string, unknown>>
}

/** Mapa id → definición. */
export type WidgetRegistry = Record<string, WidgetDefinition>
