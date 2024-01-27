import { observer } from 'mobx-react-lite'
import ItemLinkAutocompleteInput from './ItemLinkAutocompleteInput'
import { LinkingController } from '@/Controllers/LinkingController'
import LinkedItemBubble from './LinkedItemBubble'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useResponsiveAppPane } from '../Panes/ResponsivePaneProvider'
import { ElementIds } from '@/Constants/ElementIDs'
import { classNames } from '@standardnotes/utils'
import { ContentType, DecryptedItemInterface } from '@standardnotes/snjs'
import { LinkableItem } from '@/Utils/Items/Search/LinkableItem'
import { ItemLink } from '@/Utils/Items/Search/ItemLink'
import { FOCUS_TAGS_INPUT_COMMAND, keyboardStringForShortcut } from '@standardnotes/ui-services'
import { useCommandService } from '../CommandProvider'
import { useItemLinks } from '@/Hooks/useItemLinks'
import RoundIconButton from '../Button/RoundIconButton'
import VaultNameBadge from '../Vaults/VaultNameBadge'
import LastEditedByBadge from '../Vaults/LastEditedByBadge'
import { useItemVaultInfo } from '@/Hooks/useItemVaultInfo'

type Props = {
  linkingController: LinkingController
  item: DecryptedItemInterface
  hideToggle?: boolean
  readonly?: boolean
  className?: {
    base?: string
    withToggle?: string
  }
  isCollapsedByDefault?: boolean
}

const LinkedItemBubblesContainer = ({
  item,
  linkingController,
  hideToggle = false,
  readonly = false,
  className = {},
  isCollapsedByDefault = true,
}: Props) => {
  const { toggleAppPane } = useResponsiveAppPane()

  const commandService = useCommandService()

  const { unlinkItems, activateItem } = linkingController
  const unlinkItem = useCallback(
    async (itemToUnlink: LinkableItem) => {
      void unlinkItems(item, itemToUnlink)
    },
    [item, unlinkItems],
  )

  const { notesLinkedToItem, filesLinkedToItem, tagsLinkedToItem, notesLinkingToItem, filesLinkingToItem } =
    useItemLinks(item)

  const allItemsLinkedToItem: ItemLink[] = useMemo(
    () => new Array<ItemLink>().concat(notesLinkedToItem, filesLinkedToItem, tagsLinkedToItem),
    [filesLinkedToItem, notesLinkedToItem, tagsLinkedToItem],
  )

  useEffect(() => {
    return commandService.addCommandHandler({
      command: FOCUS_TAGS_INPUT_COMMAND,
      category: 'Current note',
      description: 'Link tags, notes, files',
      onKeyDown: () => {
        const input = document.getElementById(ElementIds.ItemLinkAutocompleteInput)
        if (input) {
          input.focus()
        }
      },
    })
  }, [commandService])

  const shortcut = useMemo(
    () => keyboardStringForShortcut(commandService.keyboardShortcutForCommand(FOCUS_TAGS_INPUT_COMMAND)),
    [commandService],
  )

  const [focusedId, setFocusedId] = useState<string>()
  const focusableIds = allItemsLinkedToItem
    .map((link) => link.id)
    .concat(
      notesLinkingToItem.map((link) => link.id),
      filesLinkingToItem.map((link) => link.id),
      [ElementIds.ItemLinkAutocompleteInput],
    )

  const focusPreviousItem = useCallback(() => {
    const currentFocusedIndex = focusableIds.findIndex((id) => id === focusedId)
    const previousIndex = currentFocusedIndex - 1

    if (previousIndex > -1) {
      setFocusedId(focusableIds[previousIndex])
    }
  }, [focusableIds, focusedId])

  const focusNextItem = useCallback(() => {
    const currentFocusedIndex = focusableIds.findIndex((id) => id === focusedId)
    const nextIndex = currentFocusedIndex + 1

    if (nextIndex < focusableIds.length) {
      setFocusedId(focusableIds[nextIndex])
    }
  }, [focusableIds, focusedId])

  const activateItemAndTogglePane = useCallback(
    async (item: LinkableItem) => {
      const paneId = await activateItem(item)
      if (paneId) {
        toggleAppPane(paneId)
      }
    },
    [activateItem, toggleAppPane],
  )

  const isItemBidirectionallyLinked = (link: ItemLink) => {
    const existsInAllItemLinks = !!allItemsLinkedToItem.find((item) => link.item.uuid === item.item.uuid)
    const existsInNotesLinkingToItem = !!notesLinkingToItem.find((item) => link.item.uuid === item.item.uuid)
    const existsInFilesLinkingToItem = !!filesLinkingToItem.find((item) => link.item.uuid === item.item.uuid)

    return (
      existsInAllItemLinks &&
      (link.item.content_type === ContentType.TYPES.Note ? existsInNotesLinkingToItem : existsInFilesLinkingToItem)
    )
  }

  const itemsToDisplay = allItemsLinkedToItem.concat(notesLinkingToItem).concat(filesLinkingToItem)
  const ItemsToShowWhenCollapsed = 5
  const [isCollapsed, setIsCollapsed] = useState(
    itemsToDisplay.length < ItemsToShowWhenCollapsed ? false : isCollapsedByDefault,
  )

  const visibleItems = isCollapsed ? itemsToDisplay.slice(0, ItemsToShowWhenCollapsed) : itemsToDisplay
  const nonVisibleItems = itemsToDisplay.length - visibleItems.length

  const [canShowContainerToggle, setCanShowContainerToggle] = useState(true)
  const [linkContainer, setLinkContainer] = useState<HTMLDivElement | null>(null)
  useEffect(() => {
    const container = linkContainer
    if (!container) {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      const firstChild = container.firstElementChild
      if (!firstChild) {
        return
      }

      const threshold = firstChild.clientHeight + 4
      const didWrap = container.clientHeight > threshold

      if (didWrap) {
        setCanShowContainerToggle(true)
      } else {
        setCanShowContainerToggle(false)
      }
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [linkContainer])

  const shouldHideToggle = hideToggle || (!canShowContainerToggle && !isCollapsed)

  const { vault, lastEditedByContact } = useItemVaultInfo(item)

  if (readonly && itemsToDisplay.length === 0 && !vault) {
    return null
  }

  return (
    <div
      className={classNames(
        'flex w-full flex-wrap justify-between md:flex-nowrap',
        itemsToDisplay.length > 0 && !shouldHideToggle ? 'pt-2 ' + className.withToggle : undefined,
        isCollapsed ? 'gap-4' : 'gap-1',
        className.base,
      )}
    >
      <div
        className={classNames(
          'note-view-linking-container flex min-w-80 max-w-full items-center gap-2 bg-transparent',
          allItemsLinkedToItem.length || notesLinkingToItem.length ? 'mt-1' : 'mt-0.5',
          isCollapsed ? 'overflow-hidden' : 'flex-wrap',
          !shouldHideToggle && 'mr-2',
        )}
        ref={setLinkContainer}
      >
        {!!vault && <VaultNameBadge vault={vault} />}
        {!!lastEditedByContact && <LastEditedByBadge contact={lastEditedByContact} />}
        {visibleItems.map((link) => (
          <LinkedItemBubble
            link={link}
            key={link.id}
            activateItem={activateItemAndTogglePane}
            unlinkItem={unlinkItem}
            focusPreviousItem={focusPreviousItem}
            focusNextItem={focusNextItem}
            focusedId={focusedId}
            setFocusedId={setFocusedId}
            isBidirectional={isItemBidirectionallyLinked(link)}
            readonly={readonly}
          />
        ))}
        {isCollapsed && nonVisibleItems > 0 && <span className="flex-shrink-0">and {nonVisibleItems} more...</span>}
        {!readonly && (
          <ItemLinkAutocompleteInput
            focusedId={focusedId}
            linkingController={linkingController}
            focusPreviousItem={focusPreviousItem}
            setFocusedId={setFocusedId}
            hoverLabel={`Focus input to add a link (${shortcut})`}
            item={item}
          />
        )}
      </div>
      {itemsToDisplay.length > 0 && !shouldHideToggle && (
        <RoundIconButton
          id="toggle-linking-container"
          label="Toggle linked items container"
          onClick={() => {
            setIsCollapsed((isCollapsed) => !isCollapsed)
          }}
          icon={isCollapsed ? 'chevron-down' : 'chevron-left'}
        />
      )}
    </div>
  )
}

export default observer(LinkedItemBubblesContainer)
