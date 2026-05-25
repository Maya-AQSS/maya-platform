/**
 * Skeleton placeholder mostrado mientras el layout del dashboard se carga
 * desde localStorage / backend. Estructura un grid de 12 columnas con
 * `blocks` configurables; sin props usa 2 bloques al 50% (col-span-6 / h-40).
 *
 * Para layouts no triviales pasa `blocks` con `colSpanClasses` + `heightClass`
 * (cada string es una clase Tailwind completa, no se interpola).
 *
 * Ejemplos:
 *   <DashboardSkeleton />                            ← 2 bloques 50/50 alto 40
 *   <DashboardSkeleton blockCount={3} />             ← 3 bloques 50/50/100 alto 40
 *   <DashboardSkeleton blocks={[                     ← layout personalizado
 *     { colSpanClasses: 'col-span-12 sm:col-span-8', heightClass: 'h-64' },
 *     { colSpanClasses: 'col-span-12 sm:col-span-4', heightClass: 'h-32' },
 *   ]} />
 *
 * Tailwind: usa las variables del theme Maya (`ui-border-l`,
 * `ui-dark-border`); asume que el consumidor monta el provider de tema.
 */

export interface SkeletonBlock {
  /** Clases Tailwind para columnas, e.g. `'col-span-12 sm:col-span-6'`. */
  colSpanClasses: string
  /** Clase Tailwind para altura, e.g. `'h-40'` o `'h-64'`. */
  heightClass: string
}

export interface DashboardSkeletonProps {
  /**
   * Layout explícito de bloques. Tiene prioridad sobre `blockCount`.
   */
  blocks?: SkeletonBlock[]
  /**
   * Número de bloques placeholder a renderizar con tamaño default
   * (col-span-12 sm:col-span-6 / h-40). Ignorado si `blocks` se provee.
   * Default: 2.
   */
  blockCount?: number
}

const DEFAULT_BLOCK: SkeletonBlock = {
  colSpanClasses: 'col-span-12 sm:col-span-6',
  heightClass: 'h-40',
}

export function DashboardSkeleton({ blocks, blockCount = 2 }: DashboardSkeletonProps) {
  const layout = blocks ?? Array.from({ length: blockCount }, () => DEFAULT_BLOCK)

  return (
    <div className="p-4 sm:p-6 grid grid-cols-12 gap-4 animate-pulse">
      {layout.map((block, i) => (
        <div
          key={i}
          className={`${block.colSpanClasses} ${block.heightClass} bg-ui-border-l dark:bg-ui-dark-border rounded-2xl`}
        />
      ))}
    </div>
  )
}
