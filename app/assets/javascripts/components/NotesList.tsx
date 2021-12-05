import { AppState } from '@/ui_models/app_state';
import { CollectionSort, SNNote } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { NotesListItem } from './NotesListItem';
import { toDirective } from './utils';

type Props = {
  //application: WebApplication;
  appState: AppState;
  notes: SNNote[];
  selectedNotes: Record<string, SNNote>;
  sortBy: CollectionSort;
  hideTags: boolean;
  hideDate: boolean;
  hidePreview: boolean;
};

export const NotesList: FunctionComponent<Props> = observer(
  ({
    appState,
    notes,
    selectedNotes,
    sortBy,
    hideTags,
    hideDate,
    hidePreview,
  }) => {
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

    return (
      <div className="infinite-scroll" id="notes-scrollable">
        {notes.map((note) => (
          <NotesListItem
            key={note.uuid}
            note={note}
            tags={tagsForNote(note)}
            selected={!!selectedNotes[note.uuid]}
            hideDate={hideDate}
            hidePreview={hidePreview}
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
