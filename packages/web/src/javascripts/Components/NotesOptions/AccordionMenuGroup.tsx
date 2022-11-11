import { IconType } from '@standardnotes/snjs'

export type AccordionMenuGroup<T> = {
  icon?: IconType
  iconClassName?: string
  title: string
  items: Array<T>
  featured?: boolean
}
