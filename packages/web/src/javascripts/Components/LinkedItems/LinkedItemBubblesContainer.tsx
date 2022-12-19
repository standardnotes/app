import { observer } from 'mobx-react-lite'
import ItemLinkAutocompleteInput from './ItemLinkAutocompleteInput'
import { LinkingController } from '@/Controllers/LinkingController'
import LinkedItemBubble from './LinkedItemBubble'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useResponsiveAppPane } from '../Panes/ResponsivePaneProvider'
import { ElementIds } from '@/Constants/ElementIDs'
import { classNames } from '@standardnotes/utils'
import { ContentType } from '@standardnotes/snjs'
import { LinkableItem } from '@/Utils/Items/Search/LinkableItem'
import { ItemLink } from '@/Utils/Items/Search/ItemLink'
import { FOCUS_TAGS_INPUT_COMMAND, keyboardStringForShortcut } from '@standardnotes/ui-services'
import { useCommandService } from '../CommandProvider'
import { useItemLinks } from '@/Hooks/useItemLinks'

type Props = {
  linkingController: LinkingController
}

const LinkedItemBubblesContainer = ({ linkingController }: Props) => {
  const { toggleAppPane } = useResponsiveAppPane()

  const commandService = useCommandService()

  const { activeItem, unlinkItemFromSelectedItem: unlinkItem, activateItem } = linkingController

  const { notesLinkedToItem, filesLinkedToItem, tagsLinkedToItem, notesLinkingToItem, filesLinkingToItem } =
    useItemLinks(activeItem)

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

  if (!activeItem) {
    return null
  }

  return (
    <div
      className={classNames(
        'note-view-linking-container hidden min-w-80 max-w-full flex-wrap items-center gap-2 bg-transparent md:-mr-2 md:flex',
        allItemsLinkedToItem.length || notesLinkingToItem.length ? 'mt-1' : 'mt-0.5',
      )}
    >
      {allItemsLinkedToItem
        .concat(notesLinkingToItem)
        .concat(filesLinkingToItem)
        .map((link) => (
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
      <ItemLinkAutocompleteInput
        focusedId={focusedId}
        linkingController={linkingController}
        focusPreviousItem={focusPreviousItem}
        setFocusedId={setFocusedId}
        hoverLabel={`Focus input to add a link (${shortcut})`}
        item={activeItem}
      />
    </div>
  )
}

export default observer(LinkedItemBubblesContainer)
