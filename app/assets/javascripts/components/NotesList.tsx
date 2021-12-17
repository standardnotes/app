import { KeyboardKey } from '@/services/ioService';
import { AppState } from '@/ui_models/app_state';
import { DisplayOptions } from '@/ui_models/app_state/notes_view_state';
import { SNNote } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { NotesListItem } from './NotesListItem';
import { toDirective } from './utils';

type Props = {
  appState: AppState;
  notes: SNNote[];
  selectedNotes: Record<string, SNNote>;
  displayOptions: DisplayOptions;
  paginate: () => void;
};

const FOCUSABLE_BUT_NOT_TABBABLE = -1;
const NOTES_LIST_SCROLL_THRESHOLD = 200;

export const NotesList: FunctionComponent<Props> = observer(
  ({ appState, notes, selectedNotes, displayOptions, paginate }) => {
    const { selectPreviousNote, selectNextNote } = appState.notesView;
    const { hideTags, hideDate, hideNotePreview, sortBy } = displayOptions;

    const tagsStringForNote = (note: SNNote): string => {
      if (hideTags) {
        return '';
      }
      const selectedTag = appState.selectedTag;
      if (!selectedTag) {
        return '';
      }
      if (selectedTag?.isSmartTag) {
        return appState
          .getNoteTags(note)
          .map((tag) => '#' + tag.title)
          .join(' ');
      }
      const tags = appState.getNoteTags(note);
      if (tags.length === 1) {
        return '';
      }
      return tags.map((tag) => '#' + tag.title).join(' ');
    };

    const openNoteContextMenu = (posX: number, posY: number) => {
      appState.notes.setContextMenuClickLocation({
        x: posX,
        y: posY,
      });
      appState.notes.reloadContextMenuLayout();
      appState.notes.setContextMenuOpen(true);
    };

    const onContextMenu = (note: SNNote, posX: number, posY: number) => {
      if (!selectedNotes[note.uuid]) {
        appState.notes.selectNote(note.uuid, true);
        openNoteContextMenu(posX, posY);
      } else {
        openNoteContextMenu(posX, posY);
      }
    };

    const onScroll = (e: Event) => {
      const offset = NOTES_LIST_SCROLL_THRESHOLD;
      const element = e.target as HTMLElement;
      if (
        element.scrollTop + element.offsetHeight >=
        element.scrollHeight - offset
      ) {
        paginate();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.Up) {
        e.preventDefault();
        selectPreviousNote();
      } else if (e.key === KeyboardKey.Down) {
        e.preventDefault();
        selectNextNote();
      }
    };

    return (
      <div
        className="infinite-scroll"
        id="notes-scrollable"
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      >
        {notes.map((note) => (
          <NotesListItem
            key={note.uuid}
            note={note}
            tags={tagsStringForNote(note)}
            selected={!!selectedNotes[note.uuid]}
            hideDate={hideDate}
            hidePreview={hideNotePreview}
            hideTags={hideTags}
            sortedBy={sortBy}
            onClick={() => {
              appState.notes.selectNote(note.uuid, true);
            }}
            onContextMenu={(e: MouseEvent) => {
              e.preventDefault();
              onContextMenu(note, e.clientX, e.clientY);
            }}
          />
        ))}
      </div>
    );
  }
);

export const NotesListDirective = toDirective<Props>(NotesList);
