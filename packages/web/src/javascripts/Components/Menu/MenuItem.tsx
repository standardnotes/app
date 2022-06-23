import { forwardRef, MouseEventHandler, ReactNode, Ref } from 'react'
import Icon from '@/Components/Icon/Icon'
import Switch from '@/Components/Switch/Switch'
import { SwitchProps } from '@/Components/Switch/SwitchProps'
import { IconType } from '@standardnotes/snjs'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { MenuItemType } from './MenuItemType'

type MenuItemProps = {
  type: MenuItemType
  children: ReactNode
  onClick?: MouseEventHandler<HTMLButtonElement>
  onChange?: SwitchProps['onChange']
  onBlur?: (event: { relatedTarget: EventTarget | null }) => void
  className?: string
  checked?: boolean
  icon?: IconType
  iconClassName?: string
  tabIndex?: number
}

const MenuItem = forwardRef(
  (
    {
      children,
      onClick,
      onChange,
      onBlur,
      className = '',
      type,
      checked,
      icon,
      iconClassName,
      tabIndex,
    }: MenuItemProps,
    ref: Ref<HTMLButtonElement>,
  ) => {
    return type === MenuItemType.SwitchButton && typeof onChange === 'function' ? (
      <li className="list-style-none" role="none">
        <button
          ref={ref}
          className="flex items-center justify-between border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-1.5 text-left w-full focus:bg-info-backdrop focus:shadow-none"
          onClick={() => {
            onChange(!checked)
          }}
          onBlur={onBlur}
          tabIndex={typeof tabIndex === 'number' ? tabIndex : FOCUSABLE_BUT_NOT_TABBABLE}
          role="menuitemcheckbox"
          aria-checked={checked}
        >
          <span className="flex flex-grow items-center">{children}</span>
          <Switch className="px-0" checked={checked} />
        </button>
      </li>
    ) : (
      <li className="list-style-none" role="none">
        <button
          ref={ref}
          role={type === MenuItemType.RadioButton ? 'menuitemradio' : 'menuitem'}
          tabIndex={typeof tabIndex === 'number' ? tabIndex : FOCUSABLE_BUT_NOT_TABBABLE}
          className={`flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-1.5 text-left w-full focus:bg-info-backdrop focus:shadow-none text-sm ${className}`}
          onClick={onClick}
          onBlur={onBlur}
          {...(type === MenuItemType.RadioButton ? { 'aria-checked': checked } : {})}
        >
          {type === MenuItemType.IconButton && icon ? <Icon type={icon} className={iconClassName} /> : null}
          {type === MenuItemType.RadioButton && typeof checked === 'boolean' ? (
            <div
              className={`w-4 h-4 border-2 border-solid rounded-full relative ${
                checked
                  ? 'border-info after:bg-info after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-2 after:h-2 after:rounded-full'
                  : 'border-passive-1'
              } flex-shrink-0`}
            ></div>
          ) : null}
          {children}
        </button>
      </li>
    )
  },
)

export default MenuItem
