import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';

/** Máximo de niveles de la pila de retorno (índice → show → sub-show…). */
const MAX_BACK_STACK = 5;

/**
 * Forma del `location.state` que entiende la navegación de retorno.
 * `string` se acepta por compatibilidad con el patrón legacy (`backTo: '/ruta'`);
 * la forma canónica es la pila `string[]` donde el último elemento es el
 * destino inmediato del botón Volver.
 */
export interface BackNavigationState {
  backTo?: string | string[];
}

export interface UseBackNavigationOptions {
  /** Índice canónico de la entidad ('/logs', '/themes', '/roles'…) usado cuando no hay state. */
  fallback: string;
}

export interface GoBackOptions {
  /** `true` en post-delete/post-create para que la página actual no quede en el history. */
  replace?: boolean;
}

export interface UseBackNavigationResult {
  /** Navega al tope válido de la pila `backTo`, o al fallback. Re-adjunta el resto de la pila. */
  goBack: (options?: GoBackOptions) => void;
  /** Destino resuelto (útil para `<Link>`, tooltips o tests). */
  backTarget: string;
  /** `true` si el destino procede de `location.state` y no del fallback. */
  hasBackState: boolean;
}

/**
 * Solo rutas internas de la SPA: empiezan por `/` pero no por `//` ni `/\`
 * (anti open-redirect ante un state forjado).
 */
export function isSafeInternalPath(value: unknown): value is string {
  if (typeof value !== 'string' || !value.startsWith('/')) return false;
  const second = value.charAt(1);
  return second !== '/' && second !== '\\';
}

function readBackStack(state: unknown): string[] {
  if (state === null || state === undefined || typeof state !== 'object') return [];
  const { backTo } = state as BackNavigationState;
  const entries = typeof backTo === 'string' ? [backTo] : Array.isArray(backTo) ? backTo : [];
  return entries.filter(isSafeInternalPath);
}

/**
 * Construye el `state` a adjuntar al navegar índice→show o show→sub-show:
 *
 *   navigate(`/themes/${id}`, { state: buildBackState(location) })
 *
 * Apila `pathname + search` de la ubicación actual (capturando los filtros que
 * `useServerTable` persiste en la URL) sobre la pila heredada del state actual.
 * Deduplica si el tope ya es la ubicación actual y capa la pila a 5 niveles.
 */
export function buildBackState(
  location: Pick<Location, 'pathname' | 'search' | 'state'>,
): { backTo: string[] } {
  const current = `${location.pathname}${location.search}`;
  const inherited = readBackStack(location.state);
  const stack =
    inherited[inherited.length - 1] === current ? inherited : [...inherited, current];
  return { backTo: stack.slice(-MAX_BACK_STACK) };
}

/**
 * Navegación "Volver" determinista: nunca usa `navigate(-1)`, por lo que se
 * comporta igual con acceso directo por URL o con history vacío.
 *
 *   const { goBack } = useBackNavigation({ fallback: '/error-codes' });
 *   <PageTitle onBack={() => goBack()} />
 *   // post-delete: goBack({ replace: true })
 */
export function useBackNavigation({ fallback }: UseBackNavigationOptions): UseBackNavigationResult {
  const navigate = useNavigate();
  const location = useLocation();

  const stack = useMemo(() => readBackStack(location.state), [location.state]);
  const top = stack.length > 0 ? stack[stack.length - 1] : undefined;
  const backTarget = top ?? fallback;
  const hasBackState = top !== undefined;

  const goBack = useCallback(
    (options?: GoBackOptions) => {
      const rest = stack.slice(0, -1);
      navigate(backTarget, {
        replace: options?.replace ?? false,
        state: rest.length > 0 ? { backTo: rest } : undefined,
      });
    },
    [navigate, backTarget, stack],
  );

  return { goBack, backTarget, hasBackState };
}
