type AuthLoadingScreenProps = {
  message: string
}

/**
 * Full-screen loading indicator used while OIDC / profile initialization is in progress.
 * Extracted from the identical inline component in all 5 App.tsx files.
 *
 * @example
 * <AuthLoadingScreen message={t('auth.initializing')} />
 */
export function AuthLoadingScreen({ message }: AuthLoadingScreenProps) {
  return (
    <div className="flex items-center justify-center h-screen bg-ui-body dark:bg-ui-dark-bg text-text-muted dark:text-text-dark-muted font-sans">
      {message}
    </div>
  )
}
