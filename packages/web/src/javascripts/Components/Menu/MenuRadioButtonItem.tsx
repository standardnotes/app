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
import Popover from '../Popover/Popover'

const Tooltip = ({ text }: { text: string }) => {
  const [visible, setVisible] = useState(false)
  const onClickMobile: MouseEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      event.preventDefault()
      event.stopPropagation()
      setVisible(!visible)
    },
    [visible],
  )

  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null)

  return (
    <div className="relative">
      <div
        ref={setAnchorElement}
        className={classNames('peer z-0 flex h-5 w-5 items-center justify-center rounded-full')}
        onClick={onClickMobile}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        <Icon type={'notes'} className="text-border" size="large" />
      </div>
      <Popover
        open={visible}
        title="Info"
        anchorElement={anchorElement}
        disableMobileFullscreenTakeover
        className={classNames(
          'w-60 translate-x-2 translate-y-1 select-none rounded border border-border shadow-main',
          'z-modal bg-default px-3 py-1.5 text-left',
        )}
      >
        {text}
      </Popover>
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
