import { WebApplication } from '@/Application/Application'
import { LinkableItem } from '@/Controllers/LinkingController'
import { IconType } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { forwardRef, MouseEventHandler, Ref, useRef, useState } from 'react'
import Icon from '../Icon/Icon'

type Props = {
  application: WebApplication
  item: LinkableItem
  getItemIcon: (item: LinkableItem) => IconType
  getItemTitle: (item: LinkableItem) => JSX.Element
  activateItem: (item: LinkableItem) => Promise<void>
  unlinkItem: (item: LinkableItem) => void
}

const LinkedItem = forwardRef(
  ({ application, item, getItemIcon, getItemTitle, activateItem, unlinkItem }: Props, ref: Ref<HTMLButtonElement>) => {
    const [showUnlinkButton, setShowUnlinkButton] = useState(false)
    const unlinkButtonRef = useRef<HTMLAnchorElement | null>(null)

    const [wasClicked, setWasClicked] = useState(false)

    const onFocus = () => {
      setShowUnlinkButton(true)
    }

    const onBlur = () => {
      setShowUnlinkButton(false)
    }

    const onClick: MouseEventHandler = (event) => {
      if (wasClicked && event.target !== unlinkButtonRef.current) {
        setWasClicked(false)
        void activateItem(item)
      } else {
        setWasClicked(true)
      }
    }

    const onUnlinkClick: MouseEventHandler = (event) => {
      event.stopPropagation()
      unlinkItem(item)
    }

    return (
      <button
        ref={ref}
        className="mt-2 mr-2 flex h-6 cursor-pointer items-center rounded border-0 bg-passive-4-opacity-variant py-2 pl-1 pr-2 text-xs text-text hover:bg-contrast focus:bg-contrast"
        onFocus={onFocus}
        onBlur={onBlur}
        onClick={onClick}
        /* onKeyDown={onKeyDown}
      tabIndex={getTabIndex()}
      title={longTitle} */
      >
        <Icon type={getItemIcon(item)} className="mr-1 text-info" size="small" />
        <span className="max-w-290px overflow-hidden overflow-ellipsis whitespace-nowrap">{getItemTitle(item)}</span>
        {showUnlinkButton && (
          <a
            ref={unlinkButtonRef}
            role="button"
            className="ml-2 -mr-1 flex cursor-pointer border-0 bg-transparent p-0"
            // onBlur={onBlur}
            onClick={onUnlinkClick}
          >
            <Icon type="close" className="text-neutral hover:text-info" size="small" />
          </a>
        )}
      </button>
    )
  },
)

export default observer(LinkedItem)
