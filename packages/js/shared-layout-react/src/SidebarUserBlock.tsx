import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@ceedcv-maya/shared-ui-react'

type Props = {
  userName: string
  userEmail?: string
  userInitials: string
  userAvatarUrl?: string | null
  onLogout: () => void
  onProfile?: () => void
  isDark: boolean
  onToggleDark: () => void
  /** Cuando el sidebar está colapsado, muestra solo el avatar. */
  collapsed?: boolean
}

/**
 * Bloque de usuario al fondo del sidebar.
 * - Expandido: avatar + nombre + email; al hacer click abre un menú con
 *   tema, perfil y cerrar sesión.
 * - Colapsado: solo avatar; mismo menú al click (se abre a la derecha).
 *
 * Patrón ARIA `menubutton` con flechas, Home/End, Esc y restauración de foco.
 */
export function SidebarUserBlock({
  userName,
  userEmail,
  userInitials,
  userAvatarUrl,
  onLogout,
  onProfile,
  isDark,
  onToggleDark,
  collapsed = false,
}: Props) {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const itemsRef = useRef<HTMLButtonElement[]>([])

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => itemsRef.current[0]?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open])

  function onItemKey(e: ReactKeyboardEvent<HTMLButtonElement>, idx: number) {
    const items = itemsRef.current
    if (items.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      items[(idx + 1) % items.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      items[(idx - 1 + items.length) % items.length]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      items[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      items[items.length - 1]?.focus()
    }
  }

  function registerItem(idx: number) {
    return (el: HTMLButtonElement | null) => {
      if (el) itemsRef.current[idx] = el
      else itemsRef.current.splice(idx, 1)
    }
  }

  // Construye dinámicamente la lista de items para indexar correctamente refs y teclas.
  const menuItems: Array<{
    label: string
    onClick: () => void
    danger?: boolean
    icon: () => ReactElement
    iconClass: string
  }> = []

  menuItems.push({
    label: isDark ? t('userMenu.lightMode') : t('userMenu.darkMode'),
    onClick: onToggleDark,
    icon: () => (isDark ? <SunIcon /> : <MoonIcon />),
    // Sol amber, luna púrpura — refleja el modo destino al pulsar.
    iconClass: isDark ? 'text-warning' : 'text-odoo-purple dark:text-odoo-dark-purple',
  })

  if (onProfile) {
    menuItems.push({
      label: t('userMenu.profile'),
      onClick: onProfile,
      icon: () => <ProfileIcon />,
      iconClass: 'text-odoo-teal dark:text-odoo-teal-d',
    })
  }

  menuItems.push({
    label: t('userMenu.logout'),
    onClick: onLogout,
    danger: true,
    icon: () => <LogoutIcon />,
    iconClass: 'text-danger',
  })

  // Posicionamiento del menú:
  // - Expandido: pop-up por encima del bloque, alineado a la izquierda del trigger.
  // - Colapsado: pop-out a la derecha del avatar.
  const menuPositionClass = collapsed
    ? 'left-full bottom-0 ml-2'
    : 'bottom-full left-3 right-3 mb-2'

  return (
    <div ref={rootRef} className="relative border-t border-text-inverse/8 px-3 py-3">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={userEmail ? `${userName} · ${userEmail}` : userName}
        className={[
          'w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-inverse/30',
          collapsed
            ? 'flex items-center justify-center'
            : 'flex items-center gap-3 px-2 py-2 text-left hover:bg-text-inverse/5 transition-colors',
        ].join(' ')}
      >
        <Avatar
          src={userAvatarUrl ?? undefined}
          initials={userInitials}
          name={userName}
          size="md"
          interactive={collapsed}
          className="ring-2 ring-text-inverse/10 shrink-0"
        />
        {!collapsed && (
          <>
            <span className="flex-1 min-w-0 text-base font-semibold text-text-inverse truncate">
              {userName}
            </span>
            <ChevronUpIcon
              className={`w-3 h-3 text-text-inverse/50 shrink-0 transition-transform duration-150 ${
                open ? '' : 'rotate-180'
              }`}
            />
          </>
        )}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={t('layout.userMenuOf', {
            name: userName,
            defaultValue: `Menu of ${userName}`,
          })}
          className={[
            'absolute z-[210] min-w-[200px] py-1',
            'bg-ui-card dark:bg-ui-dark-card border border-ui-border dark:border-ui-dark-border rounded-lg shadow-dropdown',
            menuPositionClass,
          ].join(' ')}
        >
          {/* En modo colapsado el trigger no muestra texto, así que el menú lo
              añade en su cabecera. En expandido el trigger ya muestra el
              nombre y omitimos esta sección para no duplicar. */}
          {collapsed ? (
            <div className="px-3 py-2 border-b border-ui-border-l dark:border-ui-dark-border-l">
              <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary truncate">
                {userName}
              </p>
            </div>
          ) : null}
          {menuItems.map((item, idx) => (
            <button
              key={item.label}
              ref={registerItem(idx)}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
              onKeyDown={(e) => onItemKey(e, idx)}
              className={[
                'w-full text-left px-3 py-2 text-sm flex items-center gap-2.5',
                'focus-visible:outline-none transition-colors',
                item.danger
                  ? 'text-danger dark:text-danger hover:bg-danger/10 focus-visible:bg-danger/10'
                  : 'text-text-primary dark:text-text-dark-primary hover:bg-ui-body dark:hover:bg-ui-dark-bg focus-visible:bg-ui-body dark:focus-visible:bg-ui-dark-bg',
              ].join(' ')}
            >
              <span className={`w-4 h-4 flex items-center justify-center shrink-0 ${item.iconClass}`}>
                {item.icon()}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}
