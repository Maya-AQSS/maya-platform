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

export default withTranslation('common')(ErrorBoundary)
