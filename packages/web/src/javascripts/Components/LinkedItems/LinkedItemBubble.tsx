import { ItemLink, LinkableItem, LinkingController } from '@/Controllers/LinkingController'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { KeyboardKey } from '@standardnotes/ui-services'
import { observer } from 'mobx-react-lite'
import { KeyboardEventHandler, MouseEventHandler, useEffect, useRef, useState } from 'react'
import { ContentType } from '@standardnotes/snjs'
import Icon from '../Icon/Icon'

type Props = {
  link: ItemLink
  getItemIcon: LinkingController['getLinkedItemIcon']
  getTitleForLinkedTag: LinkingController['getTitleForLinkedTag']
  activateItem: (item: LinkableItem) => Promise<void>
  unlinkItem: LinkingController['unlinkItemFromSelectedItem']
  focusPreviousItem: () => void
  focusNextItem: () => void
  focusedId: string | undefined
  setFocusedId: (id: string) => void
  isBidirectional: boolean
}

const LinkedItemBubble = ({
  link,
  getItemIcon,
  getTitleForLinkedTag,
  activateItem,
  unlinkItem,
  focusPreviousItem,
  focusNextItem,
  focusedId,
  setFocusedId,
  isBidirectional,
}: Props) => {
  const ref = useRef<HTMLButtonElement>(null)

  const [showUnlinkButton, setShowUnlinkButton] = useState(false)
  const unlinkButtonRef = useRef<HTMLAnchorElement | null>(null)

  const [wasClicked, setWasClicked] = useState(false)

  const handleFocus = () => {
    if (focusedId !== link.id) {
      setFocusedId(link.id)
    }
    setShowUnlinkButton(true)
  }

  const onBlur = () => {
    setShowUnlinkButton(false)
    setWasClicked(false)
  }

  const onClick: MouseEventHandler = (event) => {
    if (wasClicked && event.target !== unlinkButtonRef.current) {
      setWasClicked(false)
      void activateItem(link.item)
    } else {
      setWasClicked(true)
    }
  }

  const onUnlinkClick: MouseEventHandler = (event) => {
    event.stopPropagation()
    unlinkItem(link)
  }

  const onKeyDown: KeyboardEventHandler = (event) => {
    switch (event.key) {
      case KeyboardKey.Backspace: {
        focusPreviousItem()
        unlinkItem(link)
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

  const [icon, iconClassName] = getItemIcon(link.item)
  const tagTitle = getTitleForLinkedTag(link.item)

  useEffect(() => {
    if (link.id === focusedId) {
      ref.current?.focus()
    }
  }, [focusedId, link.id])

  return (
    <button
      ref={ref}
      className="group flex h-6 cursor-pointer items-center rounded border-0 bg-passive-4-opacity-variant py-2 pl-1 pr-2 text-sm lg:text-xs text-text hover:bg-contrast focus:bg-contrast"
      onFocus={handleFocus}
      onBlur={onBlur}
      onClick={onClick}
      title={tagTitle ? tagTitle.longTitle : link.item.title}
      onKeyDown={onKeyDown}
    >
      <Icon type={icon} className={classNames('mr-1 flex-shrink-0', iconClassName)} size="small" />
      <span className="max-w-290px flex items-center overflow-hidden overflow-ellipsis whitespace-nowrap">
        {tagTitle && <span className="text-passive-1">{tagTitle.titlePrefix}</span>}
        <span className="flex items-center gap-1">
          {link.type === 'linked-by' && link.item.content_type !== ContentType.Tag && (
            <span className={!isBidirectional ? 'hidden group-focus:block' : ''}>Linked By:</span>
          )}
          {link.item.title}
        </span>
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
