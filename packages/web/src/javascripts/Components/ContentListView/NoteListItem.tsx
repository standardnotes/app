import { isFile, SNNote } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useRef } from 'react'
import Icon from '@/Components/Icon/Icon'
import ListItemConflictIndicator from './ListItemConflictIndicator'
import ListItemFlagIcons from './ListItemFlagIcons'
import ListItemTags from './ListItemTags'
import ListItemMetadata from './ListItemMetadata'
import { DisplayableListItemProps } from './Types/DisplayableListItemProps'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import { useContextMenuEvent } from '@/Hooks/useContextMenuEvent'
import ListItemNotePreviewText from './ListItemNotePreviewText'
import { ListItemTitle } from './ListItemTitle'
import { log, LoggingDomain } from '@/Logging'
import { classNames } from '@standardnotes/utils'
import { getIconAndTintForNoteType } from '@/Utils/Items/Icons/getIconAndTintForNoteType'

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
  const { toggleAppPane } = useResponsiveAppPane()

  const listItemRef = useRef<HTMLDivElement>(null)

  const noteType = item.noteType || application.componentManager.editorForNote(item)?.package_info.note_type
  const [icon, tint] = getIconAndTintForNoteType(noteType)
  const hasFiles = application.items.itemsReferencingItem(item).filter(isFile).length > 0

  const openNoteContextMenu = (posX: number, posY: number) => {
    notesController.setContextMenuOpen(false)
    notesController.setContextMenuClickLocation({
      x: posX,
      y: posY,
    })
    notesController.reloadContextMenuLayout()
    notesController.setContextMenuOpen(true)
  }

  const openContextMenu = async (posX: number, posY: number) => {
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

  const onClick = useCallback(async () => {
    await onSelect(item, true)
  }, [item, onSelect])

  useContextMenuEvent(listItemRef, openContextMenu)

  log(LoggingDomain.ItemsList, 'Rendering note list item', item.title)

  const hasOffsetBorder = !isNextItemTiled

  return (
    <div
      ref={listItemRef}
      className={classNames(
        'content-list-item text-tex flex w-full cursor-pointer items-stretch',
        selected && `selected border-l-2 border-solid border-accessory-tint-${tint}`,
        isPreviousItemTiled && 'mt-3 border-t border-solid border-t-border',
        isNextItemTiled && 'mb-3 border-b border-solid border-b-border',
      )}
      id={item.uuid}
      onClick={onClick}
    >
      {!hideIcon ? (
        <div className="mr-0 flex flex-col items-center justify-between p-4 pr-4">
          <Icon type={icon} className={`text-accessory-tint-${tint}`} />
        </div>
      ) : (
        <div className="pr-4" />
      )}
      <div className={`min-w-0 flex-grow ${hasOffsetBorder && 'border-b border-solid border-border'} py-4 px-0`}>
        <ListItemTitle item={item} />
        <ListItemNotePreviewText item={item} hidePreview={hidePreview} />
        <ListItemMetadata item={item} hideDate={hideDate} sortBy={sortBy} />
        <ListItemTags hideTags={hideTags} tags={tags} />
        <ListItemConflictIndicator item={item} />
      </div>
      <ListItemFlagIcons className="p-4" item={item} hasFiles={hasFiles} hasBorder={hasOffsetBorder} />
    </div>
  )
}

export default observer(NoteListItem)
