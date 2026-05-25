import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { fieldControlClass, type FieldSize } from './fieldClasses'

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  fieldSize?: FieldSize
}

export const TextArea = forwardRef<HTMLTextAreaElement, Props>(function TextArea(
  { fieldSize = 'md', className = '', ...rest },
  ref,
) {
  return <textarea ref={ref} className={fieldControlClass(fieldSize, className)} {...rest} />
})
