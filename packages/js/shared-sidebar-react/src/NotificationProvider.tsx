import { type ReactNode } from 'react'

interface NotificationProviderProps {
  children: ReactNode
}

/**
 * Thin wrapper kept for API compatibility. Notification state is owned
 * directly by NotificationsBell via useNotifications; no shared context
 * is needed unless multi-consumer polling is required in the future.
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
  return <>{children}</>
}
