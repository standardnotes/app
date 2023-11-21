import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { classNames } from '@standardnotes/snjs'
import { PlatformedKeyboardShortcut } from '@standardnotes/ui-services'
import { ComponentPropsWithoutRef, ForwardedRef, forwardRef, ReactNode } from 'react'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import Switch from '../Switch/Switch'
import MenuListItem from './MenuListItem'

type Props = {
  checked: boolean
  children: ReactNode
  onChange: (checked: boolean) => void
  shortcut?: PlatformedKeyboardShortcut
  forceDesktopStyle?: boolean
} & Omit<ComponentPropsWithoutRef<'button'>, 'onChange'>

const MenuSwitchButtonItem = forwardRef(
  (
    {
      checked,
      onChange,
      disabled,
      onBlur,
      tabIndex,
      children,
      shortcut,
      className,
      forceDesktopStyle,
      ...props
    }: Props,
    ref: ForwardedRef<HTMLButtonElement>,
  ) => {
    return (
      <MenuListItem>
        <button
          disabled={disabled}
          ref={ref}
          className={classNames(
            'flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-2 md:py-1.5',
            'text-left text-text focus:bg-info-backdrop focus:shadow-none enabled:hover:bg-passive-3 enabled:hover:text-foreground',
            'text-mobile-menu-item md:text-tablet-menu-item lg:text-menu-item',
            'disabled:cursor-not-allowed disabled:opacity-60',
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
          <div className="flex items-center">
            {shortcut && <KeyboardShortcutIndicator className="mr-2" shortcut={shortcut} />}
            <Switch
              disabled={disabled}
              className="pointer-events-none flex px-0"
              checked={checked}
              onChange={onChange}
              tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
              forceDesktopStyle={forceDesktopStyle}
            />
          </div>
        </button>
      </MenuListItem>
    )
  },
)

export default MenuSwitchButtonItem
