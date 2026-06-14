import { Component, type ReactNode } from 'react'
import { withTranslation, type WithTranslation } from 'react-i18next'

interface Props extends WithTranslation {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex items-center justify-center p-6 text-sm text-danger-dark dark:text-danger">
          {this.props.t('errors.componentLoad', {
            defaultValue: 'Could not load component. Reload the page or contact support.',
          })}
        </div>
      )
    }
    return this.props.children
  }
}

/**
 * Builds a ready-to-use ErrorBoundary already wired to react-i18next for the
 * given namespace. Replaces the per-app `withTranslation('common')(ErrorBoundary)`
 * wrappers (maya_authorization / maya_dms / maya_dashboard) and avoids the
 * TS2769 that appears when the raw class is used without its i18n props.
 *
 * @example
 *   const AppErrorBoundary = createI18nErrorBoundary()
 *   <AppErrorBoundary fallback={<AppErrorFallback />}>{children}</AppErrorBoundary>
 */
export function createI18nErrorBoundary(namespace = 'common') {
  return withTranslation(namespace)(ErrorBoundary)
}

export default withTranslation('common')(ErrorBoundary)
