import { IconType } from '@standardnotes/snjs'

export type DropdownItem<T extends string> = {
  icon?: IconType
  iconClassName?: string
  label: string
  value: T
  disabled?: boolean
}
