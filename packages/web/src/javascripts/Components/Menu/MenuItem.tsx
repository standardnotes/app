import { ComponentPropsWithoutRef, forwardRef, MouseEventHandler, ReactNode, Ref } from 'react'
import Icon from '@/Components/Icon/Icon'
import { IconType } from '@standardnotes/snjs'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { classNames } from '@standardnotes/utils'
import { PlatformedKeyboardShortcut } from '@standardnotes/ui-services'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import MenuListItem from './MenuListItem'

export interface MenuItemProps extends ComponentPropsWithoutRef<'button'> {
  children: ReactNode
  onClick?: MouseEventHandler<HTMLButtonElement>
  onBlur?: (event: { relatedTarget: EventTarget | null }) => void
  className?: string
  icon?: IconType
  iconClassName?: string
  tabIndex?: number
  disabled?: boolean
  shortcut?: PlatformedKeyboardShortcut
}

const MenuItem = forwardRef(
  (
    {
      children,
      className = '',
      icon,
      iconClassName = 'w-6 h-6 md:w-5 md:h-5 text-neutral mr-2',
      tabIndex,
      shortcut,
      disabled,
      ...props
    }: MenuItemProps,
    ref: Ref<HTMLButtonElement>,
  ) => {
    return (
      <MenuListItem>
        <button
          ref={ref}
          role="menuitem"
          tabIndex={typeof tabIndex === 'number' ? tabIndex : FOCUSABLE_BUT_NOT_TABBABLE}
          className={classNames(
            'flex w-full cursor-pointer select-none border-0 bg-transparent px-3 py-2.5 text-left md:py-1.5',
            'text-mobile-menu-item text-text enabled:hover:bg-passive-3 enabled:hover:text-foreground',
            'focus:bg-info-backdrop focus:shadow-none md:text-tablet-menu-item lg:text-menu-item',
            'disabled:cursor-not-allowed disabled:opacity-60',
            className,
            className.includes('items-') ? '' : 'items-center',
          )}
          disabled={disabled}
          {...props}
        >
          {shortcut && <KeyboardShortcutIndicator className="mr-2" shortcut={shortcut} />}
          {icon ? <Icon type={icon} className={classNames('flex-shrink-0', iconClassName)} /> : null}
          {children}
        </button>
      </MenuListItem>
    )
  },
)

export default MenuItem
