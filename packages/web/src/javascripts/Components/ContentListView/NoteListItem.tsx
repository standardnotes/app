import { PLAIN_EDITOR_NAME } from '@/Constants/Constants'
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

const NoteListItem: FunctionComponent<DisplayableListItemProps> = ({
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
}) => {
  const { toggleAppPane } = useResponsiveAppPane()

  const listItemRef = useRef<HTMLDivElement>(null)

  const editorForNote = application.componentManager.editorForNote(item as SNNote)
  const editorName = editorForNote?.name ?? PLAIN_EDITOR_NAME
  const [icon, tint] = application.iconsController.getIconAndTintForNoteType(editorForNote?.package_info.note_type)
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
    const { didSelect } = await onSelect(item, true)
    if (didSelect) {
      toggleAppPane(AppPaneId.Editor)
    }
  }, [item, onSelect, toggleAppPane])

  useContextMenuEvent(listItemRef, openContextMenu)

  return (
    <div
      ref={listItemRef}
      className={`content-list-item flex w-full cursor-pointer items-stretch text-text ${
        selected && `selected border-l-2 border-solid border-accessory-tint-${tint}`
      }`}
      id={item.uuid}
      onClick={onClick}
    >
      {!hideIcon ? (
        <div className="mr-0 flex flex-col items-center justify-between p-4 pr-4">
          <Icon ariaLabel={`Icon for ${editorName}`} type={icon} className={`text-accessory-tint-${tint}`} />
        </div>
      ) : (
        <div className="pr-4" />
      )}
      <div className="min-w-0 flex-grow border-b border-solid border-border py-4 px-0">
        <ListItemTitle item={item} />
        <ListItemNotePreviewText item={item} hidePreview={hidePreview} />
        <ListItemMetadata item={item} hideDate={hideDate} sortBy={sortBy} />
        <ListItemTags hideTags={hideTags} tags={tags} />
        <ListItemConflictIndicator item={item} />
      </div>
      <ListItemFlagIcons item={item} hasFiles={hasFiles} />
    </div>
  )
}

export default observer(NoteListItem)
