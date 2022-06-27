import { FocusEventHandler, KeyboardEventHandler, ReactNode } from 'react'

export type DecoratedInputProps = {
  type?: 'text' | 'email' | 'password'
  className?: string
  id?: string
  disabled?: boolean
  left?: ReactNode[]
  right?: ReactNode[]
  value?: string
  placeholder?: string
  onChange?: (text: string) => void
  onFocus?: FocusEventHandler
  onKeyDown?: KeyboardEventHandler
  autocomplete?: boolean
}
