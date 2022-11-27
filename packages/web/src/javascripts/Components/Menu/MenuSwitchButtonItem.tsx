import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { classNames } from '@standardnotes/snjs'
import { PlatformedKeyboardShortcut } from '@standardnotes/ui-services'
import { ComponentPropsWithoutRef, ForwardedRef, forwardRef, ReactNode } from 'react'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import Switch from '../Switch/Switch'
import { SwitchProps } from '../Switch/SwitchProps'
import MenuListItem from './MenuListItem'

type Props = {
  checked: boolean
  children: ReactNode
  onChange: NonNullable<SwitchProps['onChange']>
  shortcut?: PlatformedKeyboardShortcut
} & Omit<ComponentPropsWithoutRef<'button'>, 'onChange'>

const MenuSwitchButtonItem = forwardRef(
  (
    { checked, onChange, disabled, onBlur, tabIndex, children, shortcut, className, ...props }: Props,
    ref: ForwardedRef<HTMLButtonElement>,
  ) => {
    return (
      <MenuListItem>
        <button
          disabled={disabled}
          ref={ref}
          className={classNames(
            'flex w-full cursor-pointer border-0 bg-transparent px-3 py-2 md:py-1.5',
            'text-left text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none',
            'text-mobile-menu-item md:text-tablet-menu-item lg:text-menu-item',
            className,
          )}
          onClick={() => {
            onChange(!checked)
          }}
          onBlur={onBlur}
          tabIndex={typeof tabIndex === 'number' ? tabIndex : FOCUSABLE_BUT_NOT_TABBABLE}
          role="menuitemcheckbox"
          aria-checked={checked}
          {...props}
        >
          <span className="flex flex-grow items-center">{children}</span>
          <div className="flex">
            {shortcut && <KeyboardShortcutIndicator className="mr-2" shortcut={shortcut} />}
            <Switch disabled={disabled} className="px-0" checked={checked} />
          </div>
        </button>
      </MenuListItem>
    )
  },
)

export default MenuSwitchButtonItem
