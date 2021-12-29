import { getIconForEditor } from '@/preferences/panes/general-segments';
import { WebApplication } from '@/ui_models/application';
import {
  CollectionSort,
  sanitizeHtmlString,
  SNNote,
} from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { Icon } from './Icon';

type Props = {
  application: WebApplication;
  note: SNNote;
  tags: string[];
  hideDate: boolean;
  hidePreview: boolean;
  hideTags: boolean;
  onClick: () => void;
  onContextMenu: (e: MouseEvent) => void;
  selected: boolean;
  sortedBy?: CollectionSort;
};

type NoteFlag = {
  text: string;
  class: 'info' | 'neutral' | 'warning' | 'success' | 'danger';
};

const flagsForNote = (note: SNNote) => {
  const flags = [] as NoteFlag[];
  if (note.conflictOf) {
    flags.push({
      text: 'Conflicted Copy',
      class: 'danger',
    });
  }
  if (note.errorDecrypting) {
    if (note.waitingForKey) {
      flags.push({
        text: 'Waiting For Keys',
        class: 'info',
      });
    } else {
      flags.push({
        text: 'Missing Keys',
        class: 'danger',
      });
    }
  }
  if (note.deleted) {
    flags.push({
      text: 'Deletion Pending Sync',
      class: 'danger',
    });
  }
  return flags;
};

export const NotesListItem: FunctionComponent<Props> = ({
  application,
  hideDate,
  hidePreview,
  hideTags,
  note,
  onClick,
  onContextMenu,
  selected,
  sortedBy,
  tags,
}) => {
  const flags = flagsForNote(note);
  const showModifiedDate = sortedBy === CollectionSort.UpdatedAt;
  const editorForNote = application.componentManager.editorForNote(note);
  const editorName = editorForNote?.name ?? 'Plain editor';
  const [icon, tint] = getIconForEditor(editorForNote?.identifier);

  return (
    <div
      className={`note ${selected ? 'selected' : ''}`}
      id={`note-${note.uuid}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="icon">
        <Icon
          ariaLabel={`Icon for ${editorName}`}
          type={icon}
          className={`color-accessory-tint-${tint} mb-2`}
        />
      </div>
      <div className="meta">
        <div className="name">
          <div>{note.title}</div>
          <div className="flag-icons">
            {note.locked && (
              <span title="Editing Disabled">
                <Icon
                  ariaLabel="Editing Disabled"
                  type="pencil-off"
                  className="sn-icon--small color-info"
                />
              </span>
            )}
            {note.trashed && (
              <span title="Trashed">
                <Icon
                  ariaLabel="Trashed"
                  type="trash-filled"
                  className="sn-icon--small color-danger"
                />
              </span>
            )}
            {note.archived && (
              <span title="Archived">
                <Icon
                  ariaLabel="Archived"
                  type="archive"
                  className="sn-icon--mid color-accessory-tint-3"
                />
              </span>
            )}
            {note.pinned && (
              <span title="Pinned">
                <Icon
                  ariaLabel="Pinned"
                  type="pin-filled"
                  className="sn-icon--small color-info"
                />
              </span>
            )}
          </div>
        </div>
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
            {!note.preview_html && note.preview_plain && (
              <div className="plain-preview">{note.preview_plain}</div>
            )}
            {!note.preview_html && !note.preview_plain && note.text && (
              <div className="default-preview">{note.text}</div>
            )}
          </div>
        )}
        {!hideDate || note.protected ? (
          <div className="bottom-info faded">
            {note.protected && <span>Protected {hideDate ? '' : ' • '}</span>}
            {!hideDate && showModifiedDate && (
              <span>Modified {note.updatedAtString || 'Now'}</span>
            )}
            {!hideDate && !showModifiedDate && (
              <span>{note.createdAtString || 'Now'}</span>
            )}
          </div>
        ) : null}
        {!hideTags && tags.length ? (
          <div className="tags-string">
            {tags.map((tag) => (
              <span className="tag color-foreground">
                <Icon
                  type="hashtag"
                  className="sn-icon--small color-grey-1 mr-1"
                />
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
    </div>
  );
};
