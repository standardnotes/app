import { ComponentChild } from 'preact'

export type DecoratedInputProps = {
  type?: 'text' | 'email' | 'password'
  className?: string
  disabled?: boolean
  left?: ComponentChild[]
  right?: ComponentChild[]
  value?: string
  placeholder?: string
  onChange?: (text: string) => void
  onFocus?: (event: FocusEvent) => void
  onKeyDown?: (event: KeyboardEvent) => void
  autocomplete?: boolean
}
