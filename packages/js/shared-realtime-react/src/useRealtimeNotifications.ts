import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getEchoInstance } from './createEcho';

export interface RealtimeNotificationPayload {
  id?: number;
  app?: string;
  type?: string;
  title?: string;
  body?: string;
  metadata?: Record<string, unknown>;
  is_critical?: boolean;
  scope?: 'user' | 'dashboard' | 'both';
}

export interface UseRealtimeNotificationsOptions {
  /** Keycloak UUID of the listening user. When null/undefined the hook is a no-op. */
  userId: string | null | undefined;
  /** TanStack Query keys to invalidate when a notification arrives. */
  queryKeys?: ReadonlyArray<readonly unknown[]>;
  /** Optional side-effect callback (toast, sound, etc.). */
  onNotification?: (payload: RealtimeNotificationPayload) => void;
}

const DEFAULT_QUERY_KEYS: ReadonlyArray<readonly unknown[]> = [['notifications']];

/**
 * Subscribe the current user to their private notifications channel.
 *
 * Listens for the canonical 'notification.created' broadcast and invalidates
 * the configured TanStack Query keys so paginated lists / badges refetch
 * immediately. The dot prefix on .listen() tells Echo to match the raw
 * broadcast name (set by broadcastAs() in the backend event), not the PHP
 * class name.
 *
 * Requires createEcho() to have been called at app boot — usually in the
 * top-level layout component once the user is authenticated.
 */
export function useRealtimeNotifications({
  userId,
  queryKeys = DEFAULT_QUERY_KEYS,
  onNotification,
}: UseRealtimeNotificationsOptions): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const echo = getEchoInstance();
    if (!echo) return;

    const channelName = `notifications.${userId}`;
    const channel = echo.private(channelName);
    const handler = (payload: RealtimeNotificationPayload): void => {
      for (const queryKey of queryKeys) {
        queryClient.invalidateQueries({ queryKey: [...queryKey] });
      }
      onNotification?.(payload);
    };

    channel.listen('.notification.created', handler);

    return () => {
      channel.stopListening('.notification.created');
      echo.leave(channelName);
    };
  }, [userId, queryClient, queryKeys, onNotification]);
}
