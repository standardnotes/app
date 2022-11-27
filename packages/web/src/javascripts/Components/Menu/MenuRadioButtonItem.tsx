import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { classNames } from '@standardnotes/snjs'
import { PlatformedKeyboardShortcut } from '@standardnotes/ui-services'
import { ComponentPropsWithoutRef, ForwardedRef, forwardRef, ReactNode } from 'react'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import RadioIndicator from '../Radio/RadioIndicator'
import MenuListItem from './MenuListItem'

type Props = {
  checked: boolean
  children: ReactNode
  shortcut?: PlatformedKeyboardShortcut
} & ComponentPropsWithoutRef<'button'>

const MenuRadioButtonItem = forwardRef(
  (
    { checked, disabled, tabIndex, children, shortcut, className, ...props }: Props,
    ref: ForwardedRef<HTMLButtonElement>,
  ) => {
    return (
      <MenuListItem>
        <button
          ref={ref}
          role="menuitemradio"
          tabIndex={typeof tabIndex === 'number' ? tabIndex : FOCUSABLE_BUT_NOT_TABBABLE}
          className={classNames(
            'flex w-full cursor-pointer border-0 bg-transparent px-3 py-2 text-left md:py-1.5',
            'text-mobile-menu-item text-text hover:bg-contrast hover:text-foreground',
            'focus:bg-info-backdrop focus:shadow-none md:text-tablet-menu-item lg:text-menu-item',
            className,
            className?.includes('items-') ? '' : 'items-center',
          )}
          aria-checked={checked}
          disabled={disabled}
          {...props}
        >
          {shortcut && <KeyboardShortcutIndicator className="mr-2" shortcut={shortcut} />}
          <RadioIndicator disabled={disabled} checked={checked} className="flex-shrink-0" />
          {children}
        </button>
      </MenuListItem>
    )
  },
)

export default MenuRadioButtonItem
