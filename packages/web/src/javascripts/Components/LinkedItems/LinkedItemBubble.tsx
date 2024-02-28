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
import { useApplication } from '../ApplicationProvider'
import { getTitleForLinkedTag } from '@/Utils/Items/Display/getTitleForLinkedTag'
import { getItemTitleInContextOfLinkBubble } from '@/Utils/Items/Search/doesItemMatchSearchQuery'

type Props = {
  link: ItemLink
  activateItem?: (item: LinkableItem) => Promise<void>
  unlinkItem: LinkingController['unlinkItemFromSelectedItem']
  focusPreviousItem?: () => void
  focusNextItem?: () => void
  focusedId?: string | undefined
  setFocusedId?: (id: string) => void
  isBidirectional: boolean
  inlineFlex?: boolean
  className?: string
  readonly?: boolean
  wrappable?: boolean
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
  readonly,
  wrappable,
}: Props) => {
  const ref = useRef<HTMLElement>()
  const application = useApplication()

  const [showUnlinkButton, setShowUnlinkButton] = useState(false)
  const unlinkButtonRef = useRef<HTMLElement>()

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
      if (readonly) {
        return
      }
      void activateItem?.(link.item)
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

  if (wrappable) {
    return (
      <a
        ref={(el) => (ref.current = el as HTMLElement)}
        tabIndex={0}
        className={classNames(
          'group cursor-pointer rounded align-middle [&>*]:align-middle',
          'bg-passive-4-opacity-variant outline-1 outline-info hover:bg-contrast focus:bg-contrast focus:outline',
          'whitespace-pre-wrap text-left text-sm text-text hover:no-underline focus:no-underline lg:text-xs',
          'py-1 pl-1 pr-2',
          className,
        )}
        onFocus={handleFocus}
        onBlur={onBlur}
        onClick={onClick}
        title={tagTitle ? tagTitle.longTitle : link.item.title}
        onKeyDown={onKeyDown}
      >
        <Icon type={icon} className={classNames('mr-1 inline', iconClassName)} size="small" />
        {tagTitle && <span className="text-passive-1">{tagTitle.titlePrefix}</span>}
        {link.type === 'linked-by' && link.item.content_type !== ContentType.TYPES.Tag && (
          <span className={!isBidirectional ? 'hidden group-focus:inline' : ''}>Linked By:</span>
        )}
        <span>{getItemTitleInContextOfLinkBubble(link.item)}</span>
        {showUnlinkButton && !readonly && (
          <button
            ref={(el) => (unlinkButtonRef.current = el as HTMLElement)}
            role="button"
            className="-mr-1 ml-2 inline-flex cursor-pointer border-0 bg-transparent p-0"
            onClick={onUnlinkClick}
          >
            <Icon type="close" className="text-neutral hover:text-info" size="small" />
          </button>
        )}
      </a>
    )
  }

  return (
    <button
      ref={(el) => (ref.current = el as HTMLElement)}
      className={classNames(
        'group h-6 cursor-pointer items-center rounded bg-passive-4-opacity-variant py-2 pl-1 pr-2 align-middle text-sm',
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
      <span className="flex items-center overflow-hidden overflow-ellipsis whitespace-nowrap">
        {tagTitle && <span className="text-passive-1">{tagTitle.titlePrefix}</span>}
        <span className="flex items-center gap-1">
          {link.type === 'linked-by' && link.item.content_type !== ContentType.TYPES.Tag && (
            <span className={!isBidirectional ? 'hidden group-focus:block' : ''}>Linked By:</span>
          )}
          {getItemTitleInContextOfLinkBubble(link.item)}
        </span>
      </span>
      {showUnlinkButton && !readonly && (
        <a
          ref={(el) => (unlinkButtonRef.current = el as HTMLElement)}
          role="button"
          className="-mr-1 ml-2 flex cursor-pointer border-0 bg-transparent p-0"
          onClick={onUnlinkClick}
        >
          <Icon type="close" className="text-neutral hover:text-info" size="small" />
        </a>
      )}
    </button>
  )
}

export default observer(LinkedItemBubble)
