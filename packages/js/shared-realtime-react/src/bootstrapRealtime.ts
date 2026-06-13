/// <reference path="./env.d.ts" />
/**
 * bootstrapRealtime — factory canonique para inicializar el cliente Echo/Reverb.
 *
 * Extrae el patrón boilerplate de `src/lib/realtimeBootstrap.ts` que se repite en
 * cada microservicio Maya. La diferencia frente a la versión local es que el slug
 * del servicio se pasa como argumento (en vez de estar hardcodeado como
 * `'authorization'`), lo que hace la función reutilizable en los cinco frontends.
 *
 * @example
 * // src/lib/realtimeBootstrap.ts (en cualquier app Maya)
 * import { bootstrapRealtime } from '@ceedcv-maya/shared-realtime-react';
 * import { getBearerToken } from '../api/http';
 *
 * export function bootstrapApp(): void {
 *   bootstrapRealtime('dms', getBearerToken);
 * }
 */
import { createEcho } from './createEcho';
import type { ReverbBootstrapConfig } from './createEcho';

/**
 * Resolver for the bearer token. Matches the `getBearerToken` signature
 * returned by `createApiClient` in `@ceedcv-maya/shared-auth-react`.
 */
type BearerTokenResolver = ReverbBootstrapConfig['getBearerToken'];

/**
 * Derives the hostname of a peer service using the Maya slot-prefix convention.
 * Duplicated here (instead of importing from shared-auth-react) to keep
 * shared-realtime-react dependency-free from shared-auth-react.
 */
function peerOrigin(targetService: string): string {
  const { protocol, hostname } = window.location;
  const firstDot = hostname.indexOf('.');
  if (firstDot === -1) return `${protocol}//${hostname}`;

  const firstSegment = hostname.substring(0, firstDot);
  const domainSuffix = hostname.substring(firstDot);
  const lastDash = firstSegment.lastIndexOf('-');
  const slotPrefix = lastDash !== -1 ? firstSegment.substring(0, lastDash + 1) : '';

  return `${protocol}//${slotPrefix}${targetService}${domainSuffix}`;
}

export interface BootstrapRealtimeOptions {
  /**
   * Overrides for individual Reverb env vars. When not provided, values are
   * read from `import.meta.env.VITE_REVERB_*`.
   * Mainly useful for testing without setting env vars.
   */
  appKey?: string;
  host?: string;
  scheme?: string;
  port?: string;
}

/**
 * Reads env vars and wires up the Echo singleton for the given service slug.
 * No-ops when `VITE_REVERB_APP_KEY` is absent or empty.
 *
 * @param serviceSlug    - Service name used to derive `<slug>-reverb` and
 *                         `<slug>-api` peer origins (e.g. `'authorization'`,
 *                         `'dms'`, `'dashboard'`).
 * @param getBearerToken - Async resolver for the Keycloak JWT. Passed directly
 *                         to `createEcho` for per-request fresh tokens.
 * @param options        - Optional overrides (mainly for testing).
 */
export function bootstrapRealtime(
  serviceSlug: string,
  getBearerToken: BearerTokenResolver,
  options?: BootstrapRealtimeOptions,
): void {
  const env = import.meta.env as Record<string, string | undefined>;

  const appKey = (options?.appKey ?? env.VITE_REVERB_APP_KEY)?.trim();
  if (!appKey) return; // sin config no hay realtime

  const rawHost = options?.host ?? env.VITE_REVERB_HOST;
  const host = rawHost?.trim() || new URL(peerOrigin(`${serviceSlug}-reverb`)).hostname;

  const rawScheme = options?.scheme ?? env.VITE_REVERB_SCHEME;
  const scheme = (rawScheme === 'http' ? 'http' : 'https') as 'http' | 'https';

  const rawPort = options?.port ?? env.VITE_REVERB_PORT;
  const port = Number.parseInt(rawPort ?? '', 10) || (scheme === 'https' ? 443 : 80);

  const authEndpoint = `${peerOrigin(`${serviceSlug}-api`)}/api/v1/broadcasting/auth`;

  createEcho({ appKey, host, port, scheme, authEndpoint, getBearerToken });
}
