import { FocusEventHandler, KeyboardEventHandler, ReactNode } from 'react'

export type DecoratedInputProps = {
  autocomplete?: boolean
  spellcheck?: boolean
  className?: {
    container?: string
    input?: string
  }
  disabled?: boolean
  id?: string
  left?: ReactNode[]
  onBlur?: FocusEventHandler
  onChange?: (text: string) => void
  onFocus?: FocusEventHandler
  onKeyDown?: KeyboardEventHandler
  onKeyUp?: KeyboardEventHandler
  placeholder?: string
  right?: ReactNode[]
  title?: string
  type?: React.HTMLInputTypeAttribute
  value?: string
  roundedFull?: boolean
}
