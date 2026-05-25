import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

type TabsContextValue = {
  activeId: string
  onActivate: (id: string) => void
  baseId: string
  registerTrigger: (id: string, el: HTMLButtonElement | null) => void
  triggerOrder: () => string[]
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext(consumer: string): TabsContextValue {
  const ctx = useContext(TabsContext)
  if (!ctx) {
    throw new Error(`<Tabs.${consumer}> debe usarse dentro de <Tabs>`)
  }
  return ctx
}

type TabsProps = {
  /** ID del tab activo. */
  value: string
  /** Callback cuando el usuario cambia de tab. */
  onValueChange: (id: string) => void
  children: ReactNode
  className?: string
}

/**
 * Compound component para tabs con navegación por teclado (←/→/Home/End).
 *
 *   <Tabs value={tab} onValueChange={setTab}>
 *     <Tabs.List ariaLabel="Secciones">
 *       <Tabs.Trigger id="general">General</Tabs.Trigger>
 *       <Tabs.Trigger id="advanced">Avanzado</Tabs.Trigger>
 *     </Tabs.List>
 *     <Tabs.Panel id="general">…</Tabs.Panel>
 *     <Tabs.Panel id="advanced">…</Tabs.Panel>
 *   </Tabs>
 */
function TabsRoot({ value, onValueChange, children, className = '' }: TabsProps) {
  const baseId = useId()
  const triggersRef = useRef<Map<string, HTMLButtonElement | null>>(new Map())

  const registerTrigger = useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) triggersRef.current.set(id, el)
    else triggersRef.current.delete(id)
  }, [])

  const triggerOrder = useCallback(() => Array.from(triggersRef.current.keys()), [])

  const ctx: TabsContextValue = {
    activeId: value,
    onActivate: onValueChange,
    baseId,
    registerTrigger,
    triggerOrder,
  }

  return (
    <TabsContext.Provider value={ctx}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

type TabsListProps = HTMLAttributes<HTMLDivElement> & {
  ariaLabel: string
}

function TabsList({ ariaLabel, className = '', children, ...rest }: TabsListProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1 border-b border-ui-border-l dark:border-ui-dark-border-l ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  )
}

type TriggerProps = {
  id: string
  children: ReactNode
  disabled?: boolean
  className?: string
}

function TabsTrigger({ id, children, disabled = false, className = '' }: TriggerProps) {
  const { activeId, onActivate, baseId, registerTrigger, triggerOrder } = useTabsContext('Trigger')
  const isActive = activeId === id

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const order = triggerOrder()
    if (order.length === 0) return
    const idx = order.indexOf(activeId)
    let next: string | undefined
    if (e.key === 'ArrowRight') next = order[(idx + 1) % order.length]
    else if (e.key === 'ArrowLeft') next = order[(idx - 1 + order.length) % order.length]
    else if (e.key === 'Home') next = order[0]
    else if (e.key === 'End') next = order[order.length - 1]
    if (next) {
      e.preventDefault()
      onActivate(next)
    }
  }

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-trigger-${id}`}
      aria-controls={`${baseId}-panel-${id}`}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => onActivate(id)}
      onKeyDown={onKey}
      ref={(el) => registerTrigger(id, el)}
      className={[
        'px-3 py-2 -mb-px border-b-2 text-sm font-medium transition-colors',
        'duration-[var(--duration-fast)] ease-[var(--ease-out)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-odoo-purple/35 rounded-t',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isActive
          ? 'border-odoo-purple text-text-primary dark:border-odoo-dark-purple dark:text-text-dark-primary'
          : 'border-transparent text-text-secondary hover:text-text-primary dark:text-text-dark-secondary dark:hover:text-text-dark-primary',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
}

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  id: string
}

function TabsPanel({ id, className = '', children, ...rest }: PanelProps) {
  const { activeId, baseId } = useTabsContext('Panel')
  const isActive = activeId === id

  if (!isActive) return null

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${id}`}
      aria-labelledby={`${baseId}-trigger-${id}`}
      tabIndex={0}
      className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-odoo-purple/35 rounded ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  )
}

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Panel: TabsPanel,
})
