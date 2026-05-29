import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<'reverb'> | undefined;
  }
}

export interface ReverbBootstrapConfig {
  /** Reverb app key — VITE_REVERB_APP_KEY. Required. */
  appKey: string;
  /** Reverb host the browser connects to (Traefik-fronted hostname). */
  host: string;
  /** Public TLS port — typically 443 in production, 8080 in plain dev. */
  port: number;
  /** 'http' falls back to ws://, 'https' to wss://. */
  scheme: 'http' | 'https';
  /** Absolute URL to POST /broadcasting/auth at — must include /api/v1 prefix. */
  authEndpoint: string;
  /**
   * Resolver for the bearer JWT sent to authEndpoint. Called per authorize
   * request so the client always sends a fresh token (handles silent refresh).
   * Return null to deny the channel without making the request.
   */
  getBearerToken: () => string | null | undefined;
}

let instance: Echo<'reverb'> | null = null;
let pusherInstalled = false;

/**
 * Build (or return) the singleton Echo client wired to a Reverb server.
 *
 * Singleton on purpose: every component that needs realtime in the same app
 * shares the same WebSocket. Call disconnectEcho() on full logout/teardown
 * if you want to drop the connection.
 *
 * Channel authorization uses the bearer token from getBearerToken() because
 * the Maya ecosystem authenticates against Keycloak JWT (Authorization
 * header) and the default Echo authorizer assumes a session cookie.
 */
export function createEcho(config: ReverbBootstrapConfig): Echo<'reverb'> {
  if (instance) return instance;

  if (!config.appKey?.trim()) {
    throw new Error('createEcho: appKey is required to bootstrap the Reverb client');
  }

  if (!pusherInstalled) {
    window.Pusher = Pusher;
    pusherInstalled = true;
  }

  instance = new Echo({
    broadcaster: 'reverb',
    key: config.appKey,
    wsHost: config.host,
    wsPort: config.port,
    wssPort: config.port,
    forceTLS: config.scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: config.authEndpoint,
    auth: {
      headers: {
        Accept: 'application/json',
      },
    },
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        const token = config.getBearerToken();
        if (!token) {
          callback(new Error('no_bearer_token'), null);
          return;
        }
        fetch(config.authEndpoint, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
        })
          .then(async (response) => {
            if (!response.ok) {
              callback(new Error(`broadcasting_auth_${response.status}`), null);
              return;
            }
            callback(null, await response.json());
          })
          .catch((err: unknown) => {
            callback(err instanceof Error ? err : new Error('broadcasting_auth_failed'), null);
          });
      },
    }),
  });

  window.Echo = instance;
  return instance;
}

export function getEchoInstance(): Echo<'reverb'> | null {
  return instance;
}

export function disconnectEcho(): void {
  if (instance) {
    instance.disconnect();
    instance = null;
    window.Echo = undefined;
  }
}
