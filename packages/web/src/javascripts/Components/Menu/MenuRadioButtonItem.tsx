import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { classNames } from '@standardnotes/snjs'
import { PlatformedKeyboardShortcut } from '@standardnotes/ui-services'
import {
  ComponentPropsWithoutRef,
  ForwardedRef,
  forwardRef,
  MouseEventHandler,
  ReactNode,
  useCallback,
  useState,
} from 'react'
import Icon from '../Icon/Icon'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import RadioIndicator from '../Radio/RadioIndicator'
import MenuListItem from './MenuListItem'

const Tooltip = ({ text }: { text: string }) => {
  const [mobileVisible, setMobileVisible] = useState(false)
  const onClickMobile: MouseEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      event.preventDefault()
      event.stopPropagation()
      setMobileVisible(!mobileVisible)
    },
    [mobileVisible],
  )

  return (
    <div className="relative">
      <div
        className={classNames('peer z-0 flex h-5 w-5 items-center justify-center rounded-full')}
        onClick={onClickMobile}
      >
        <Icon type={'notes'} className="text-border" size="large" />
        <span className="sr-only">Note sync status</span>
      </div>
      <div
        className={classNames(
          'z-tooltip',
          'hidden',
          'absolute top-full right-0 w-60 translate-x-2 translate-y-1 select-none rounded border border-border shadow-main',
          'bg-default py-1.5 px-3 text-left peer-hover:block peer-focus:block',
        )}
      >
        {text}
      </div>
    </div>
  )
}

type Props = {
  checked: boolean
  children: ReactNode
  shortcut?: PlatformedKeyboardShortcut
  info?: string
} & ComponentPropsWithoutRef<'button'>

const MenuRadioButtonItem = forwardRef(
  (
    { checked, disabled, tabIndex, children, shortcut, className, info, ...props }: Props,
    ref: ForwardedRef<HTMLButtonElement>,
  ) => {
    return (
      <MenuListItem>
        <button
          ref={ref}
          role="menuitemradio"
          tabIndex={typeof tabIndex === 'number' ? tabIndex : FOCUSABLE_BUT_NOT_TABBABLE}
          className={classNames(
            'flex w-full cursor-pointer gap-2 border-0 bg-transparent px-3 py-2 text-left md:py-1.5',
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
          {info && <Tooltip text={info} />}
        </button>
      </MenuListItem>
    )
  },
)

export default MenuRadioButtonItem
