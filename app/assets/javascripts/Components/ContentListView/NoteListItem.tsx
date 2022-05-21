import { PLAIN_EDITOR_NAME } from '@/Constants'
import { sanitizeHtmlString, SNNote } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'
import { Icon } from '@/Components/Icon/Icon'
import { ListItemConflictIndicator } from './ListItemConflictIndicator'
import { ListItemFlagIcons } from './ListItemFlagIcons'
import { ListItemTags } from './ListItemTags'
import { ListItemTimestamps } from './ListItemTimestamps'
import { DisplayableListItemProps } from './Types/DisplayableListItemProps'

export const NoteListItem: FunctionComponent<DisplayableListItemProps> = observer(
  ({ application, appState, hideDate, hideIcon, hideTags, hidePreview, item, selected, sortBy, tags }) => {
    const editorForNote = application.componentManager.editorForNote(item as SNNote)
    const editorName = editorForNote?.name ?? PLAIN_EDITOR_NAME
    const [icon, tint] = application.iconsController.getIconAndTintForNoteType(editorForNote?.package_info.note_type)
    const hasFiles = application.items.getFilesForNote(item as SNNote).length > 0

    const openNoteContextMenu = (posX: number, posY: number) => {
      appState.notes.setContextMenuClickLocation({
        x: posX,
        y: posY,
      })
      appState.notes.reloadContextMenuLayout()
      appState.notes.setContextMenuOpen(true)
    }

    const openContextMenu = (posX: number, posY: number) => {
      void appState.selectedItems.selectItem(item.uuid, true)
      openNoteContextMenu(posX, posY)
    }

    return (
      <div
        className={`content-list-item flex items-stretch w-full cursor-pointer ${
          selected && 'selected border-0 border-l-2px border-solid border-info'
        }`}
        id={item.uuid}
        onClick={() => {
          void appState.selectedItems.selectItem(item.uuid, true)
        }}
        onContextMenu={(event) => {
          event.preventDefault()
          openContextMenu(event.clientX, event.clientY)
        }}
      >
        {!hideIcon && (
          <div className="flex flex-col items-center justify-between p-4 pr-3 mr-0">
            <Icon ariaLabel={`Icon for ${editorName}`} type={icon} className={`color-accessory-tint-${tint}`} />
          </div>
        )}
        <div className="flex-grow min-w-0 py-4 px-0 border-0 border-b-1 border-solid border-main">
          <div className="flex items-start justify-between font-semibold text-base leading-1.3 overflow-hidden">
            <div className="break-word mr-2">{item.title}</div>
          </div>
          {!hidePreview && !item.hidePreview && !item.protected && (
            <div className="overflow-hidden overflow-ellipsis text-sm">
              {item.preview_html && (
                <div
                  className="my-1"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtmlString(item.preview_html),
                  }}
                ></div>
              )}
              {!item.preview_html && item.preview_plain && (
                <div className="leading-1.3 overflow-hidden line-clamp-1 mt-1">{item.preview_plain}</div>
              )}
              {!item.preview_html && !item.preview_plain && item.text && (
                <div className="leading-1.3 overflow-hidden line-clamp-1 mt-1">{item.text}</div>
              )}
            </div>
          )}
          <ListItemTimestamps item={item} hideDate={hideDate} sortBy={sortBy} />
          <ListItemTags hideTags={hideTags} tags={tags} />
          <ListItemConflictIndicator item={item} />
        </div>
        <ListItemFlagIcons item={item} hasFiles={hasFiles} />
      </div>
    )
  },
)
