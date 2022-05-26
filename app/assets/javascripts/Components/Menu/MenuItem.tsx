import { forwardRef, MouseEventHandler, ReactNode, Ref } from 'react'
import Icon from '@/Components/Icon/Icon'
import Switch from '@/Components/Switch/Switch'
import { SwitchProps } from '@/Components/Switch/SwitchProps'
import { IconType } from '@standardnotes/snjs'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants'
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
          className="sn-dropdown-item focus:bg-info-backdrop focus:shadow-none justify-between"
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
          className={`sn-dropdown-item focus:bg-info-backdrop focus:shadow-none ${className}`}
          onClick={onClick}
          onBlur={onBlur}
          {...(type === MenuItemType.RadioButton ? { 'aria-checked': checked } : {})}
        >
          {type === MenuItemType.IconButton && icon ? <Icon type={icon} className={iconClassName} /> : null}
          {type === MenuItemType.RadioButton && typeof checked === 'boolean' ? (
            <div className={`pseudo-radio-btn ${checked ? 'pseudo-radio-btn--checked' : ''} flex-shrink-0`}></div>
          ) : null}
          {children}
        </button>
      </li>
    )
  },
)

export default MenuItem
