import type { LabelHTMLAttributes, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type Props = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode
  required?: boolean
  /**
   * Tooltip del asterisco de campo obligatorio. Opcional: si se omite, se
   * resuelve vía `t('form.required')` con fallback "Obligatorio".
   */
  requiredTitle?: string
}

export function FieldLabel({ children, required, requiredTitle, className = '', ...rest }: Props) {
  const { t } = useTranslation('common')
  const requiredLabel = requiredTitle ?? t('form.required', { defaultValue: 'Obligatorio' })
  const base = 'block text-xs font-bold uppercase tracking-wider text-text-muted dark:text-text-dark-muted mb-1'
  return (
    <label className={className ? `${base} ${className}` : base} {...rest}>
      {children}
      {required && <span className="text-danger ml-0.5" title={requiredLabel}>*</span>}
    </label>
  )
}
