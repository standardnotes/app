import { LinkableItem, LinkingController } from '@/Controllers/LinkingController'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { KeyboardKey } from '@standardnotes/ui-services'
import { observer } from 'mobx-react-lite'
import { KeyboardEventHandler, MouseEventHandler, useEffect, useRef, useState } from 'react'
import Icon from '../Icon/Icon'

type Props = {
  item: LinkableItem
  getItemIcon: LinkingController['getLinkedItemIcon']
  getTitleForLinkedTag: LinkingController['getTitleForLinkedTag']
  activateItem: (item: LinkableItem) => Promise<void>
  unlinkItem: (item: LinkableItem) => void
  focusPreviousItem: () => void
  focusNextItem: () => void
  focusedId: string | undefined
}

const LinkedItemBubble = ({
  item,
  getItemIcon,
  getTitleForLinkedTag,
  activateItem,
  unlinkItem,
  focusPreviousItem,
  focusNextItem,
  focusedId,
}: Props) => {
  const ref = useRef<HTMLButtonElement>(null)

  const [showUnlinkButton, setShowUnlinkButton] = useState(false)
  const unlinkButtonRef = useRef<HTMLAnchorElement | null>(null)

  const [wasClicked, setWasClicked] = useState(false)

  const handleFocus = () => {
    setShowUnlinkButton(true)
  }

  const onBlur = () => {
    setShowUnlinkButton(false)
    setWasClicked(false)
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

  const onKeyDown: KeyboardEventHandler = (event) => {
    switch (event.key) {
      case KeyboardKey.Backspace: {
        focusPreviousItem()
        unlinkItem(item)
        break
      }
      case KeyboardKey.Left:
        focusPreviousItem()
        break
      case KeyboardKey.Right:
        focusNextItem()
        break
    }
  }

  const [icon, iconClassName] = getItemIcon(item)
  const tagTitle = getTitleForLinkedTag(item)

  useEffect(() => {
    if (item.uuid === focusedId) {
      ref.current?.focus()
    }
  }, [focusedId, item.uuid])

  return (
    <button
      ref={ref}
      className="flex h-6 cursor-pointer items-center rounded border-0 bg-passive-4-opacity-variant py-2 pl-1 pr-2 text-xs text-text hover:bg-contrast focus:bg-contrast"
      onFocus={handleFocus}
      onBlur={onBlur}
      onClick={onClick}
      title={tagTitle ? tagTitle.longTitle : item.title}
      onKeyDown={onKeyDown}
    >
      <Icon type={icon} className={classNames('mr-1 flex-shrink-0', iconClassName)} size="small" />
      <span className="max-w-290px overflow-hidden overflow-ellipsis whitespace-nowrap">
        {tagTitle && <span className="text-passive-1">{tagTitle.titlePrefix}</span>}
        {item.title}
      </span>
      {showUnlinkButton && (
        <a
          ref={unlinkButtonRef}
          role="button"
          className="ml-2 -mr-1 flex cursor-pointer border-0 bg-transparent p-0"
          onClick={onUnlinkClick}
        >
          <Icon type="close" className="text-neutral hover:text-info" size="small" />
        </a>
      )}
    </button>
  )
}

export default observer(LinkedItemBubble)
