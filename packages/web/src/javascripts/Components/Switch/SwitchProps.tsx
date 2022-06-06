import { ReactNode } from 'react'

export type SwitchProps = {
  checked?: boolean
  onChange?: (checked: boolean) => void
  className?: string
  children?: ReactNode
  role?: string
  disabled?: boolean
  tabIndex?: number
}
