import { IconType } from '@standardnotes/icons'

export type DropdownItem = {
  icon?: IconType
  iconClassName?: string
  label: string
  value: string
  disabled?: boolean
}
