import { getIconForEditor } from '@/preferences/panes/general-segments';
import { WebApplication } from '@/ui_models/application';
import { CollectionSort, SNNote } from '@standardnotes/snjs';
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
  if (note.locked) {
    flags.push({
      text: 'Editing Disabled',
      class: 'neutral',
    });
  }
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
  const [icon, tint] = getIconForEditor(editorForNote?.identifier);

  return (
    <div
      className={`note ${selected ? 'selected' : ''}`}
      id={`note-${note.uuid}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="icon">
        <Icon type={icon} className={`color-accessory-tint-${tint} mb-2`} />
        <div className="flex flex-col items-center">
          {note.trashed && (
            <Icon type="trash-filled" className="color-danger" />
          )}
          {note.archived && (
            <Icon type="archive" className="color-accessory-tint-3" />
          )}
        </div>
      </div>
      <div className="meta">
        {flags && flags.length > 0 ? (
          <div className="note-flags flex flex-wrap">
            {flags.map((flag) => (
              <div className={`flag ${flag.class}`}>
                <div className="label">{flag.text}</div>
              </div>
            ))}
          </div>
        ) : null}
        <div className="name">
          <div>{note.title}</div>
          <div className="flag-icons">
            {note.pinned && (
              <Icon type="pin-filled" className="sn-icon--small color-info" />
            )}
            {note.protected && (
              <Icon type="lock-filled" className="sn-icon--small color-info" />
            )}
          </div>
        </div>
        {!hidePreview && !note.hidePreview && !note.protected ? (
          <div className="note-preview">
            {note.preview_html ? (
              <div
                className="html-preview"
                dangerouslySetInnerHTML={{ __html: note.preview_html }}
              ></div>
            ) : null}
            {!note.preview_html && note.preview_plain ? (
              <div className="plain-preview">{note.preview_plain}</div>
            ) : null}
            {!note.preview_html && !note.preview_plain && note.text ? (
              <div className="default-preview">{note.text}</div>
            ) : null}
          </div>
        ) : null}
        {!hideDate || note.protected ? (
          <div className="bottom-info faded">
            {/* {note.protected ? (
              <span>Protected {hideDate ? '' : ' • '}</span>
            ) : null} */}
            {!hideDate && showModifiedDate ? (
              <span>Modified {note.updatedAtString || 'Now'}</span>
            ) : null}
            {!hideDate && !showModifiedDate ? (
              <span>{note.createdAtString || 'Now'}</span>
            ) : null}
          </div>
        ) : null}
        {!hideTags && tags.length ? (
          <div className="tags-string">
            {tags.map((tag) => (
              <span className="tag mr-2">
                <Icon
                  type="hashtag"
                  className="color-grey-1 sn-icon--small mr-1"
                />
                <span className="color-foreground">{tag}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
