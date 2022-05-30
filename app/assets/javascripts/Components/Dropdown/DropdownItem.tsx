import { IconType } from '@standardnotes/snjs'

export type DropdownItem = {
  icon?: IconType
  iconClassName?: string
  label: string
  value: string
  disabled?: boolean
}
