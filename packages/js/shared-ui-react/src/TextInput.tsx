import { forwardRef, type InputHTMLAttributes } from 'react'
import { fieldControlClass, type FieldSize } from './fieldClasses'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  fieldSize?: FieldSize
  error?: boolean
}

export const TextInput = forwardRef<HTMLInputElement, Props>(function TextInput(
  { fieldSize = 'md', error, className = '', ...rest },
  ref,
) {
  const errorCls = error ? 'border-danger dark:border-danger' : ''
  return (
    <input
      ref={ref}
      className={fieldControlClass(fieldSize, `${errorCls} ${className}`)}
      {...rest}
    />
  )
})
