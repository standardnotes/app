import { observer } from 'mobx-react-lite'
import ItemLinkAutocompleteInput from './ItemLinkAutocompleteInput'
import { LinkingController } from '@/Controllers/LinkingController'
import LinkedItemBubble from './LinkedItemBubble'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { remToPx } from '@/Utils'

type Props = {
  linkingController: LinkingController
  item: DecryptedItemInterface
  hideToggle?: boolean
}

const LinkedItemBubblesContainer = ({ item, linkingController, hideToggle = false }: Props) => {
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
      (link.item.content_type === ContentType.Note ? existsInNotesLinkingToItem : existsInFilesLinkingToItem)
    )
  }

  const [isCollapsed, setIsCollapsed] = useState(false)

  const itemsToDisplay = allItemsLinkedToItem.concat(notesLinkingToItem).concat(filesLinkingToItem)
  const visibleItems = isCollapsed ? itemsToDisplay.slice(0, 5) : itemsToDisplay
  const nonVisibleItems = itemsToDisplay.length - visibleItems.length

  const [canShowContainerToggle, setCanShowContainerToggle] = useState(false)
  const linkContainerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = linkContainerRef.current

    if (!container) {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      const LinkInputHeightInRem = 1.75

      if (container.clientHeight > remToPx(LinkInputHeightInRem)) {
        setCanShowContainerToggle(true)
      } else {
        setCanShowContainerToggle(false)
      }
    })

    resizeObserver.observe(linkContainerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div
      className={classNames(
        'flex w-full justify-between',
        itemsToDisplay.length > 0 && 'pt-2',
        isCollapsed ? 'gap-4' : 'gap-1',
      )}
    >
      <div
        className={classNames(
          'note-view-linking-container flex min-w-80 max-w-full items-center gap-2 bg-transparent md:-mr-2',
          allItemsLinkedToItem.length || notesLinkingToItem.length ? 'mt-1' : 'mt-0.5',
          isCollapsed ? 'overflow-hidden' : 'flex-wrap',
        )}
        ref={linkContainerRef}
      >
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
          />
        ))}
        {isCollapsed && nonVisibleItems > 0 && <span className="flex-shrink-0">and {nonVisibleItems} more...</span>}
        <ItemLinkAutocompleteInput
          focusedId={focusedId}
          linkingController={linkingController}
          focusPreviousItem={focusPreviousItem}
          setFocusedId={setFocusedId}
          hoverLabel={`Focus input to add a link (${shortcut})`}
          item={item}
        />
      </div>
      {itemsToDisplay.length > 0 && !hideToggle && canShowContainerToggle && (
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
