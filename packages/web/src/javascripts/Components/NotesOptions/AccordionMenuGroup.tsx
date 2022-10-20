import { IconType } from '@standardnotes/icons'

export type AccordionMenuGroup<T> = {
  icon?: IconType
  iconClassName?: string
  title: string
  items: Array<T>
}
