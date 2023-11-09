import { isFile, SNNote } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, MouseEvent, useCallback, useRef } from 'react'
import Icon from '@/Components/Icon/Icon'
import ListItemConflictIndicator from './ListItemConflictIndicator'
import ListItemFlagIcons from './ListItemFlagIcons'
import ListItemTags from './ListItemTags'
import ListItemMetadata from './ListItemMetadata'
import { DisplayableListItemProps } from './Types/DisplayableListItemProps'
import { useContextMenuEvent } from '@/Hooks/useContextMenuEvent'
import ListItemNotePreviewText from './ListItemNotePreviewText'
import { ListItemTitle } from './ListItemTitle'
import { log, LoggingDomain } from '@/Logging'
import { classNames } from '@standardnotes/utils'
import { getIconAndTintForNoteType } from '@/Utils/Items/Icons/getIconAndTintForNoteType'
import ListItemVaultInfo from './ListItemVaultInfo'
import { NoteDragDataFormat } from '../Tags/DragNDrop'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import useItem from '@/Hooks/useItem'
import CheckIndicator from '../Checkbox/CheckIndicator'

const NoteListItem: FunctionComponent<DisplayableListItemProps<SNNote>> = ({
  application,
  notesController,
  onSelect,
  hideDate,
  hideIcon,
  hideTags,
  hidePreview,
  item,
  selected,
  sortBy,
  tags,
  isPreviousItemTiled,
  isNextItemTiled,
}) => {
  const listItemRef = useRef<HTMLDivElement>(null)
  const liveItem = useItem<SNNote>(item.uuid)

  const editor = liveItem ? application.componentManager.editorForNote(liveItem) : undefined
  const noteType = liveItem?.noteType ? liveItem.noteType : editor ? editor.noteType : undefined

  const [icon, tint] = getIconAndTintForNoteType(noteType)
  const hasFiles = application.items.itemsReferencingItem(item).filter(isFile).length > 0

  const openNoteContextMenu = (posX: number, posY: number) => {
    notesController.setContextMenuClickLocation({
      x: posX,
      y: posY,
    })
    notesController.setContextMenuOpen(true)
  }

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const handleContextMenuEvent = async (posX: number, posY: number) => {
    if (isMobileScreen) {
      if (!application.itemListController.isMultipleSelectionMode) {
        application.itemListController.replaceSelection(item)
      }
      application.itemListController.enableMultipleSelectionMode()
      return
    }

    let shouldOpenContextMenu = selected

    if (!selected) {
      const { didSelect } = await onSelect(item)
      if (didSelect) {
        shouldOpenContextMenu = true
      }
    }

    if (shouldOpenContextMenu) {
      openNoteContextMenu(posX, posY)
    }
  }

  const onClick = useCallback(
    (event: MouseEvent) => {
      const hasMultiSelectionModifierKey = !isMobileScreen && (event.ctrlKey || event.metaKey)
      if (hasMultiSelectionModifierKey && !application.itemListController.isMultipleSelectionMode) {
        application.itemListController.enableMultipleSelectionMode()
      }
      if (selected && !application.itemListController.isMultipleSelectionMode) {
        application.itemListController.openSingleSelectedItem({ userTriggered: true }).catch(console.error)
        return
      }
      onSelect(item, true).catch(console.error)
    },
    [application.itemListController, isMobileScreen, item, onSelect, selected],
  )

  useContextMenuEvent(listItemRef, handleContextMenuEvent)

  log(LoggingDomain.ItemsList, 'Rendering note list item', item.title)

  const hasOffsetBorder = !isNextItemTiled

  const dragPreview = useRef<HTMLDivElement>()

  const createDragPreview = () => {
    if (!listItemRef.current) {
      throw new Error('List item ref is not set')
    }

    const element = listItemRef.current.cloneNode(true)
    // Only keep icon & title in drag preview
    Array.from(element.childNodes[1].childNodes).forEach((node, key) => {
      if (key !== 0) {
        node.remove()
      }
    })
    element.childNodes[2].remove()
    if (element instanceof HTMLDivElement) {
      element.style.width = `${listItemRef.current.clientWidth}px`
      element.style.position = 'absolute'
      element.style.top = '0'
      element.style.left = '0'
      element.style.zIndex = '-100000'
      document.body.appendChild(element)
      dragPreview.current = element
    }
    return element as HTMLDivElement
  }

  return (
    <div
      ref={listItemRef}
      role="button"
      className={classNames(
        'content-list-item flex w-full cursor-pointer items-stretch border-l-2 text-text',
        selected
          ? `selected ${
              application.itemListController.isMultipleSelectionMode ? 'border-info' : `border-accessory-tint-${tint}`
            }`
          : 'border-transparent',
        isPreviousItemTiled && 'mt-3 border-t border-t-border',
        isNextItemTiled && 'mb-3 border-b border-b-border',
      )}
      id={item.uuid}
      onClick={onClick}
      draggable={!isMobileScreen && !application.itemListController.isMultipleSelectionMode}
      onDragStart={(event) => {
        if (!listItemRef.current) {
          return
        }

        const { dataTransfer } = event

        const element = createDragPreview()
        dataTransfer.setDragImage(element, 0, 0)
        dataTransfer.setData(NoteDragDataFormat, item.uuid)
      }}
      onDragLeave={() => {
        if (dragPreview.current) {
          dragPreview.current.remove()
        }
      }}
    >
      {application.itemListController.isMultipleSelectionMode ? (
        <div className="mr-0 flex flex-col items-center justify-between gap-2 p-4 pr-4">
          <CheckIndicator className="md:!h-5 md:!w-5" checked={selected} />
        </div>
      ) : !hideIcon ? (
        <div className="mr-0 flex flex-col items-center justify-between gap-2 p-4 pr-4">
          <Icon type={icon} className={`text-accessory-tint-${tint}`} />
        </div>
      ) : (
        <div className="pr-4" />
      )}
      <div className={`min-w-0 flex-grow ${hasOffsetBorder && 'border-b border-solid border-border'} px-0 py-4`}>
        <ListItemTitle item={item} />
        <ListItemNotePreviewText item={item} hidePreview={hidePreview} />
        <ListItemMetadata item={item} hideDate={hideDate} sortBy={sortBy} />
        <ListItemTags hideTags={hideTags} tags={tags} />
        <ListItemConflictIndicator item={item} />
        <ListItemVaultInfo item={item} className="mt-1.5" />
      </div>
      <ListItemFlagIcons className="p-4" item={item} hasFiles={hasFiles} hasBorder={hasOffsetBorder} />
    </div>
  )
}

export default observer(NoteListItem)
