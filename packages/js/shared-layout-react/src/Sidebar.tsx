import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { SidebarUserBlock } from './SidebarUserBlock'
import { MayaLogoIcon } from './MayaLogoIcon'
import { SidebarCollapsedProvider } from './SidebarCollapsedContext'
import type { NavItem } from './types'

interface SidebarProps {
  navItems: NavItem[]
  brandName: string
  brandVersion?: string
  /** URL de imagen del logo. Si no se aporta, se usa `<MayaLogoIcon />`. */
  brandLogoUrl?: string
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void

  // Footer en orden vertical: favoritos → user block
  favoritesSlot?: ReactNode
  /** Notificaciones — se ubican en el header (top-right). */
  notificationsSlot?: ReactNode

  // Datos para el bloque de usuario
  userName: string
  userEmail?: string
  userInitials: string
  userAvatarUrl?: string | null
  onLogout: () => void
  onProfile?: () => void

  // Toggle dark mode (movido del Topbar al UserBlock)
  isDark: boolean
  onToggleDark: () => void
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

export function Sidebar({
  navItems,
  brandName,
  brandVersion,
  brandLogoUrl,
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
  favoritesSlot,
  notificationsSlot,
  userName,
  userEmail,
  userInitials,
  userAvatarUrl,
  onLogout,
  onProfile,
  isDark,
  onToggleDark,
}: SidebarProps) {
  const { t } = useTranslation('common')
  const effectiveCollapsed = collapsed && !mobileOpen

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[99] md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 bg-sidebar-gradient text-text-inverse',
          'flex flex-col z-[100] border-r border-text-inverse/8',
          mobileOpen
            ? 'translate-x-0 pointer-events-auto'
            : '-translate-x-full md:translate-x-0 pointer-events-none md:pointer-events-auto',
        ].join(' ')}
        style={{
          width: effectiveCollapsed ? '4.25rem' : '17rem',
          transition: 'width 200ms ease, transform 200ms ease',
        }}
      >
        {/* ── Header: logo + brand + (notificaciones top-right) ── */}
        <div
          className={[
            'h-16 flex items-center border-b border-text-inverse/8 shrink-0',
            effectiveCollapsed ? 'justify-center px-2' : 'gap-2.5 px-4',
          ].join(' ')}
        >
          <span className="shrink-0 flex items-center justify-center">
            {brandLogoUrl ? (
              <img
                src={brandLogoUrl}
                alt={brandName}
                className="w-9 h-9 object-contain"
              />
            ) : (
              <MayaLogoIcon size={36} />
            )}
          </span>

          {!effectiveCollapsed && (
            <span className="flex-1 min-w-0 text-base font-display font-bold text-text-inverse tracking-wide truncate">
              {brandName}
            </span>
          )}

          {!effectiveCollapsed && notificationsSlot ? (
            <div className="shrink-0 ml-auto flex items-center">
              {notificationsSlot}
            </div>
          ) : null}
        </div>

        {/* Notificaciones flotantes (solo cuando el sidebar está colapsado en
            desktop). Se ubican a la derecha del sidebar para no taparlo.
            Estilo oscuro tipo sidebar para diferenciarse del fondo claro. */}
        {notificationsSlot && effectiveCollapsed ? (
          <div
            className="hidden md:flex fixed top-3 z-[101] items-center justify-center w-11 h-11 rounded-full bg-sidebar-gradient text-text-inverse border border-text-inverse/10 shadow-[0_8px_22px_-8px_rgba(0,0,0,0.45)]"
            style={{ left: 'calc(4.25rem + 0.75rem)' }}
          >
            {notificationsSlot}
          </div>
        ) : null}

        {/* ── Nav: items + favoritos en línea ── */}
        <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              title={effectiveCollapsed ? item.label : undefined}
              onClick={(event) => {
                item.onClick?.(event)
                if (mobileOpen && !event.defaultPrevented) onMobileClose()
              }}
              className={({ isActive }: { isActive: boolean }) =>
                [
                  'relative w-full flex items-center rounded-xl text-left text-sm font-medium',
                  'motion-safe:transition-all motion-safe:duration-150',
                  'overflow-hidden whitespace-nowrap py-2.5',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-inverse/30',
                  effectiveCollapsed ? 'justify-center px-0' : 'gap-3 px-3.5',
                  isActive
                    ? 'bg-gradient-primary text-text-inverse shadow-[0_4px_14px_-4px_rgba(113,75,103,0.55)]'
                    : 'text-text-inverse/70 hover:bg-text-inverse/8 hover:text-text-inverse',
                ].join(' ')
              }
            >
              <span className="w-6 h-6 flex items-center justify-center shrink-0">
                <item.icon />
              </span>
              {!effectiveCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}

          {/* Favoritos justo debajo de los enlaces (no pinned al fondo). El
              propio componente devuelve null si no hay favoritos, por lo que
              no se reserva espacio cuando está vacío. En modo colapsado los
              widgets internos (SidebarFavorites, SidebarProcesos) reciben el
              estado vía `useSidebarCollapsed()` para renderizar solo iconos. */}
          <SidebarCollapsedProvider value={effectiveCollapsed}>
            {favoritesSlot}
          </SidebarCollapsedProvider>
        </nav>

        {/* ── Botón flotante de colapso (estilo Beluga) ── */}
        <button
          type="button"
          onClick={onToggle}
          className={[
            'hidden md:flex absolute top-20 -right-3 z-[101]',
            'w-6 h-6 items-center justify-center rounded-full',
            'bg-ui-card dark:bg-ui-dark-card text-text-secondary dark:text-text-dark-secondary',
            'border border-ui-border-l dark:border-ui-dark-border shadow-card-md',
            'hover:text-odoo-purple dark:hover:text-odoo-dark-purple',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-odoo-purple/35',
            'transition-colors',
          ].join(' ')}
          aria-label={collapsed
            ? t('layout.expandSidebarMenu', { defaultValue: 'Expand side menu' })
            : t('layout.collapseSidebarMenu', { defaultValue: 'Collapse side menu' })}
        >
          <ChevronIcon collapsed={collapsed} />
        </button>

        {/* ── Footer: solo bloque de usuario ── */}
        <div className="shrink-0">
          <SidebarUserBlock
            userName={userName}
            userEmail={userEmail}
            userInitials={userInitials}
            userAvatarUrl={userAvatarUrl}
            onLogout={onLogout}
            onProfile={onProfile}
            isDark={isDark}
            onToggleDark={onToggleDark}
            collapsed={effectiveCollapsed}
          />

          {brandVersion && !effectiveCollapsed ? (
            <p className="px-4 pb-3 pt-0.5 text-xs text-text-inverse/35 whitespace-nowrap">
              {brandVersion}
            </p>
          ) : null}
        </div>
      </aside>
    </>
  )
}
