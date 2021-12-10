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

export const NotesList: FunctionComponent<Props> = observer(
  ({ appState, notes, selectedNotes, displayOptions, paginate }) => {
    const { hideTags, hideDate, hideNotePreview, sortBy } = displayOptions;

    const tagsForNote = (note: SNNote): string => {
      if (hideTags) {
        return '';
      } else {
        const selectedTag = appState.selectedTag;
        if (!selectedTag) {
          return '';
        } else if (selectedTag?.isSmartTag) {
          return appState
            .getNoteTags(note)
            .map((tag) => '#' + tag.title)
            .join(' ');
        } else {
          const tags = appState.getNoteTags(note);
          if (tags.length === 1) return '';
          return tags.map((tag) => '#' + tag.title).join(' ');
        }
      }
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
      const offset = 200;
      const element = e.target as HTMLElement;
      if (
        element?.scrollTop + element?.offsetHeight >=
        element?.scrollHeight - offset
      ) {
        paginate();
      }
    };

    return (
      <div
        className="infinite-scroll"
        id="notes-scrollable"
        onScroll={onScroll}
      >
        {notes.map((note) => (
          <NotesListItem
            key={note.uuid}
            note={note}
            tags={tagsForNote(note)}
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
