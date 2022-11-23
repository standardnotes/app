import { LinkingController } from '@/Controllers/LinkingController'
import { classNames } from '@standardnotes/utils'
import { KeyboardKey } from '@standardnotes/ui-services'
import { observer } from 'mobx-react-lite'
import { KeyboardEventHandler, MouseEventHandler, useEffect, useRef, useState } from 'react'
import { ContentType } from '@standardnotes/snjs'
import Icon from '../Icon/Icon'
import { ItemLink } from '@/Utils/Items/Search/ItemLink'
import { LinkableItem } from '@/Utils/Items/Search/LinkableItem'
import { getIconForItem } from '@/Utils/Items/Icons/getIconForItem'
import { useApplication } from '../ApplicationView/ApplicationProvider'
import { getTitleForLinkedTag } from '@/Utils/Items/Display/getTitleForLinkedTag'

type Props = {
  link: ItemLink
  activateItem: (item: LinkableItem) => Promise<void>
  unlinkItem: LinkingController['unlinkItemFromSelectedItem']
  focusPreviousItem?: () => void
  focusNextItem?: () => void
  focusedId?: string | undefined
  setFocusedId?: (id: string) => void
  isBidirectional: boolean
  inlineFlex?: boolean
  className?: string
}

const LinkedItemBubble = ({
  link,
  activateItem,
  unlinkItem,
  focusPreviousItem,
  focusNextItem,
  focusedId,
  setFocusedId,
  isBidirectional,
  inlineFlex,
  className,
}: Props) => {
  const ref = useRef<HTMLButtonElement>(null)
  const application = useApplication()

  const [showUnlinkButton, setShowUnlinkButton] = useState(false)
  const unlinkButtonRef = useRef<HTMLAnchorElement | null>(null)

  const [wasClicked, setWasClicked] = useState(false)

  const handleFocus = () => {
    if (focusedId !== link.id) {
      setFocusedId?.(link.id)
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
    void unlinkItem(link.item)
  }

  const onKeyDown: KeyboardEventHandler = (event) => {
    switch (event.key) {
      case KeyboardKey.Backspace: {
        focusPreviousItem?.()
        void unlinkItem(link.item)
        break
      }
      case KeyboardKey.Left:
        focusPreviousItem?.()
        break
      case KeyboardKey.Right:
        focusNextItem?.()
        break
    }
  }

  const [icon, iconClassName] = getIconForItem(link.item, application)
  const tagTitle = getTitleForLinkedTag(link.item, application)

  useEffect(() => {
    if (link.id === focusedId) {
      ref.current?.focus()
    }
  }, [focusedId, link.id])

  return (
    <button
      ref={ref}
      className={classNames(
        'group h-6 cursor-pointer items-center rounded border-0 bg-passive-4-opacity-variant py-2 pl-1 pr-2 text-sm',
        'text-text hover:bg-contrast focus:bg-contrast lg:text-xs',
        inlineFlex ? 'inline-flex' : 'flex',
        className,
      )}
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
