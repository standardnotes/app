import { MenuItemIconSize } from '@/Constants/TailwindClassNames'
import { classNames } from '@standardnotes/utils'

export const menuItemTextClassNames = 'text-mobile-menu-item md:text-tablet-menu-item lg:text-menu-item'

export const menuItemClassNames = classNames(
  menuItemTextClassNames,
  'flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none',
)

export const menuItemSwitchClassNames = classNames(menuItemTextClassNames, menuItemClassNames, 'justify-between')

export const iconClass = `text-neutral mr-2 ${MenuItemIconSize}`
