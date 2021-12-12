import { getEditorIconType } from '@/preferences/panes/general-segments';
import { WebApplication } from '@/ui_models/application';
import { CollectionSort, SNNote } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { Icon } from './Icon';

type Props = {
  application: WebApplication;
  note: SNNote;
  tags: string;
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
  if (note.pinned) {
    flags.push({
      text: 'Pinned',
      class: 'info',
    });
  }
  if (note.archived) {
    flags.push({
      text: 'Archived',
      class: 'warning',
    });
  }
  if (note.locked) {
    flags.push({
      text: 'Editing Disabled',
      class: 'neutral',
    });
  }
  if (note.trashed) {
    flags.push({
      text: 'Deleted',
      class: 'danger',
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
  const icon = getEditorIconType(editorForNote?.identifier);

  return (
    <div
      className={`note ${selected ? 'selected' : ''}`}
      id={`note-${note.uuid}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="icon">
        <Icon type={icon} />
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
        <div className="name">{note.title}</div>
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
            {note.protected ? (
              <span>Protected {hideDate ? '' : ' • '}</span>
            ) : null}
            {!hideDate && showModifiedDate ? (
              <span>Modified {note.updatedAtString || 'Now'}</span>
            ) : null}
            {!hideDate && !showModifiedDate ? (
              <span>{note.createdAtString || 'Now'}</span>
            ) : null}
          </div>
        ) : null}
        {!hideTags ? (
          <div className="tags-string">
            <div className="faded">{tags}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
