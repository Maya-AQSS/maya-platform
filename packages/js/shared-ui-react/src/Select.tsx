import { forwardRef, type SelectHTMLAttributes } from 'react'
import { fieldControlClass, type FieldSize } from './fieldClasses'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  fieldSize?: FieldSize
  error?: boolean
}

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { fieldSize = 'sm', error, className = '', children, ...rest },
  ref,
) {
  const errorCls = error ? 'border-danger dark:border-danger' : ''
  return (
    <select
      ref={ref}
      className={fieldControlClass(fieldSize, `${errorCls} ${className}`)}
      {...rest}
    >
      {children}
    </select>
  )
})
