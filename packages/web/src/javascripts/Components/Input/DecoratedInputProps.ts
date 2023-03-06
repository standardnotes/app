import { FocusEventHandler, KeyboardEventHandler, ReactNode } from 'react'

export type DecoratedInputProps = {
  autocomplete?: boolean
  autofocus?: boolean
  spellcheck?: boolean
  className?: {
    container?: string
    input?: string
    left?: string
    right?: string
  }
  disabled?: boolean
  id?: string
  left?: ReactNode[]
  onBlur?: FocusEventHandler
  onChange?: (text: string) => void
  onFocus?: FocusEventHandler
  onKeyDown?: KeyboardEventHandler
  onKeyUp?: KeyboardEventHandler
  onEnter?: () => void
  placeholder?: string
  right?: ReactNode[]
  title?: string
  type?: React.HTMLInputTypeAttribute
  value?: string
  defaultValue?: string
  roundedFull?: boolean
}
