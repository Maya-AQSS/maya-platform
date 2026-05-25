import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useDarkMode } from './useDarkMode'
import { HamburgerIcon } from './navIcons'
import type { NavItem } from './types'

type AppLayoutProps = {
  navItems: NavItem[]
  brandName: string
  brandVersion?: string
  /** Imagen del logo de la app (opcional). Si no se aporta, usa logo Maya. */
  brandLogoUrl?: string

  // Datos de usuario (van al fondo del sidebar)
  userName: string
  userEmail?: string
  userInitials: string
  userAvatarUrl?: string | null
  onLogout: () => void
  onProfile?: () => void

  // Slots opcionales en el footer del sidebar
  /** Bloque de favoritos (típicamente <SidebarFavorites />). */
  favoritesSlot?: ReactNode
  /** Notificaciones (típicamente <NotificationsBell />). */
  notificationsSlot?: ReactNode

  /** Si se aporta, renderiza children en lugar de <Outlet />. */
  children?: ReactNode
}

/**
 * Layout principal Maya — versión 2026 sin Topbar.
 * - Sidebar con brand, nav, y footer apilado (favoritos / notificaciones / usuario).
 * - El contenido principal renderiza directamente las rutas; cada página gestiona
 *   su propio `<PageTitle>` (sin header global).
 * - Toggle de tema, perfil y logout viven en el SidebarUserBlock al fondo del sidebar.
 *
 * Skip-link `#main-content` para WCAG 2.4.1 (Bypass Blocks).
 */
export function AppLayout({
  navItems,
  brandName,
  brandVersion,
  brandLogoUrl,
  userName,
  userEmail,
  userInitials,
  userAvatarUrl,
  onLogout,
  onProfile,
  favoritesSlot,
  notificationsSlot,
  children,
}: AppLayoutProps) {
  const { t } = useTranslation('common')
  const { isDark, toggle: handleToggleDark } = useDarkMode()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Exponemos el ancho efectivo del sidebar como CSS variable para que
  // overlays/modales descendientes puedan posicionarse al lado del aside
  // sin cubrirlo. Se actualiza con la transición y respeta el modo móvil.
  const sidebarWidthDesktop = sidebarCollapsed ? '4.25rem' : '17rem'

  return (
    <div
      className="min-h-screen bg-app-gradient font-sans"
      style={{ ['--sidebar-w' as string]: sidebarWidthDesktop }}
    >
      {/* Skip-link: visible solo al recibir foco con Tab. WCAG 2.4.1. */}
      <a
        href="#main-content"
        className="
          sr-only focus:not-sr-only
          focus:fixed focus:top-2 focus:left-2 focus:z-[var(--z-index-toast,500)]
          focus:px-3 focus:py-2 focus:rounded-md
          focus:bg-gradient-primary focus:text-text-inverse
          focus:shadow-card-md focus:outline-none focus:ring-2 focus:ring-odoo-purple/35
          text-sm font-semibold
        "
      >
        {t('layout.skipToContent', { defaultValue: 'Skip to main content' })}
      </a>

      <Sidebar
        navItems={navItems}
        brandName={brandName}
        brandVersion={brandVersion}
        brandLogoUrl={brandLogoUrl}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        favoritesSlot={favoritesSlot}
        notificationsSlot={notificationsSlot}
        userName={userName}
        userEmail={userEmail}
        userInitials={userInitials}
        userAvatarUrl={userAvatarUrl}
        onLogout={onLogout}
        onProfile={onProfile}
        isDark={isDark}
        onToggleDark={handleToggleDark}
      />

      {/* Botón hamburguesa flotante en móvil (sin topbar). */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label={t('layout.openSidebarMenu', { defaultValue: 'Open side menu' })}
        className="md:hidden fixed top-4 left-4 z-[90] inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-primary text-text-inverse shadow-[0_4px_14px_-4px_rgba(113,75,103,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-odoo-purple/35"
      >
        <HamburgerIcon />
      </button>

      <div
        className={`flex flex-col min-h-screen transition-[margin] duration-200 ${
          sidebarCollapsed ? 'md:ml-[4.25rem]' : 'md:ml-[17rem]'
        }`}
      >
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-clip focus-visible:outline-none"
        >
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}
