import { createContext, useContext } from 'react'

/**
 * Estado del sidebar (colapsado vs expandido). Lo provee el `AppLayout`
 * y lo consumen widgets que viven dentro del `favoritesSlot`, como
 * `SidebarFavorites` o el `SidebarProcesos` de DMS, para renderizar
 * en modo icono-only cuando el aside está colapsado.
 *
 * Default `false` (expandido) — si un consumidor olvida envolver con el
 * provider, los componentes seguirán funcionando como antes.
 */
const SidebarCollapsedContext = createContext<boolean>(false)

export const SidebarCollapsedProvider = SidebarCollapsedContext.Provider

export function useSidebarCollapsed(): boolean {
  return useContext(SidebarCollapsedContext)
}
