type AppErrorFallbackProps = {
  /** Main heading. Default: "Ha ocurrido un error inesperado" */
  heading?: string
  /** Secondary description. Default: "Por favor, recarga la página. Si el problema persiste, contacta con soporte." */
  description?: string
  /** Reload button label. Default: "Recargar página" */
  reloadLabel?: string
}

/**
 * Standalone error fallback UI — use inside an error boundary's render fallback.
 * Strings are injectable via props so each app can translate them; Spanish defaults
 * match the original AppErrorBoundary in maya_authorization.
 *
 * @example
 * // inside a class ErrorBoundary render():
 * if (this.state.hasError) return <AppErrorFallback />
 *
 * @example
 * // with custom strings:
 * <AppErrorFallback heading={t('errors.unexpected')} reloadLabel={t('actions.reload')} />
 */
export function AppErrorFallback({
  heading = 'Ha ocurrido un error inesperado',
  description = 'Por favor, recarga la página. Si el problema persiste, contacta con soporte.',
  reloadLabel = 'Recargar página',
}: AppErrorFallbackProps = {}) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 bg-ui-body dark:bg-ui-dark-bg text-text-primary dark:text-text-dark-primary font-sans">
      <h1 className="text-2xl font-bold">{heading}</h1>
      <p className="text-text-secondary dark:text-text-dark-secondary">{description}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="px-4 py-2 rounded bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors"
      >
        {reloadLabel}
      </button>
    </div>
  )
}
