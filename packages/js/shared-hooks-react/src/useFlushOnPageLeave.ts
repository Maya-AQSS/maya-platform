import { useEffect, useRef } from 'react';

/**
 * Ejecuta `flush` cuando el usuario oculta la pestaña o navega fuera
 * (cambio de app, cerrar pestaña, etc.). Complementa el debounce del autoguardado.
 */
export function useFlushOnPageLeave(
  flush: () => void | Promise<void>,
  enabled = true,
): void {
  const flushRef = useRef(flush);
  flushRef.current = flush;

  useEffect(() => {
    if (!enabled) return;

    const run = () => {
      void flushRef.current();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        run();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', run);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', run);
    };
  }, [enabled]);
}
