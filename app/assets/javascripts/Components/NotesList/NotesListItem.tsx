import { WebApplication } from '@/UIModels/Application'
import { CollectionSort, CollectionSortProperty, sanitizeHtmlString, SNNote } from '@standardnotes/snjs'
import { FunctionComponent } from 'preact'
import { Icon } from '@/Components/Icon/Icon'
import { PLAIN_EDITOR_NAME } from '@/Constants'

type Props = {
  application: WebApplication
  note: SNNote
  tags: string[]
  hideDate: boolean
  hidePreview: boolean
  hideTags: boolean
  hideEditorIcon: boolean
  onClick: () => void
  onContextMenu: (e: MouseEvent) => void
  selected: boolean
  sortedBy?: CollectionSortProperty
}

type NoteFlag = {
  text: string
  class: 'info' | 'neutral' | 'warning' | 'success' | 'danger'
}

const flagsForNote = (note: SNNote) => {
  const flags = [] as NoteFlag[]
  if (note.conflictOf) {
    flags.push({
      text: 'Conflicted Copy',
      class: 'danger',
    })
  }

  return flags
}

export const NotesListItem: FunctionComponent<Props> = ({
  application,
  hideDate,
  hidePreview,
  hideTags,
  hideEditorIcon,
  note,
  onClick,
  onContextMenu,
  selected,
  sortedBy,
  tags,
}) => {
  const flags = flagsForNote(note)
  const hasFiles = application.items.getFilesForNote(note).length > 0
  const showModifiedDate = sortedBy === CollectionSort.UpdatedAt
  const editorForNote = application.componentManager.editorForNote(note)
  const editorName = editorForNote?.name ?? PLAIN_EDITOR_NAME
  const [icon, tint] = application.iconsController.getIconAndTintForNoteType(editorForNote?.package_info.note_type)

  return (
    <div
      className={`note ${selected ? 'selected' : ''}`}
      id={`note-${note.uuid}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {!hideEditorIcon && (
        <div className="icon">
          <Icon ariaLabel={`Icon for ${editorName}`} type={icon} className={`color-accessory-tint-${tint}`} />
        </div>
      )}
      <div className={`meta ${hideEditorIcon ? 'icon-hidden' : ''}`}>
        <div className="name-container">{note.title.length ? <div className="name">{note.title}</div> : null}</div>
        {!hidePreview && !note.hidePreview && !note.protected && (
          <div className="note-preview">
            {note.preview_html && (
              <div
                className="html-preview"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtmlString(note.preview_html),
                }}
              ></div>
            )}
            {!note.preview_html && note.preview_plain && <div className="plain-preview">{note.preview_plain}</div>}
            {!note.preview_html && !note.preview_plain && note.text && (
              <div className="default-preview">{note.text}</div>
            )}
          </div>
        )}
        {!hideDate || note.protected ? (
          <div className="bottom-info faded">
            {note.protected && <span>Protected {hideDate ? '' : ' • '}</span>}
            {!hideDate && showModifiedDate && <span>Modified {note.updatedAtString || 'Now'}</span>}
            {!hideDate && !showModifiedDate && <span>{note.createdAtString || 'Now'}</span>}
          </div>
        ) : null}
        {!hideTags && tags.length ? (
          <div className="tags-string">
            {tags.map((tag) => (
              <span className="tag color-foreground">
                <Icon type="hashtag" className="sn-icon--small color-grey-1 mr-1" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        ) : null}
        {flags.length ? (
          <div className="note-flags flex flex-wrap">
            {flags.map((flag) => (
              <div className={`flag ${flag.class}`}>
                <div className="label">{flag.text}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flag-icons">
        {note.locked && (
          <span title="Editing Disabled">
            <Icon ariaLabel="Editing Disabled" type="pencil-off" className="sn-icon--small color-info" />
          </span>
        )}
        {note.trashed && (
          <span title="Trashed">
            <Icon ariaLabel="Trashed" type="trash-filled" className="sn-icon--small color-danger" />
          </span>
        )}
        {note.archived && (
          <span title="Archived">
            <Icon ariaLabel="Archived" type="archive" className="sn-icon--mid color-accessory-tint-3" />
          </span>
        )}
        {note.pinned && (
          <span title="Pinned">
            <Icon ariaLabel="Pinned" type="pin-filled" className="sn-icon--small color-info" />
          </span>
        )}
        {hasFiles && (
          <span title="Files">
            <Icon ariaLabel="Files" type="attachment-file" className="sn-icon--small color-info" />
          </span>
        )}
      </div>
    </div>
  )
}
