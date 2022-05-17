import { WebApplication } from '@/UIModels/Application'
import { KeyboardKey } from '@/Services/IOService'
import { AppState } from '@/UIModels/AppState'
import { DisplayOptions } from '@/UIModels/AppState/NotesViewState'
import { SNNote, SNTag } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'
import { NotesListItem } from './NotesListItem'
import { FOCUSABLE_BUT_NOT_TABBABLE, NOTES_LIST_SCROLL_THRESHOLD } from '@/Constants'
import { useCallback } from 'preact/hooks'

type Props = {
  application: WebApplication
  appState: AppState
  notes: SNNote[]
  selectedNotes: Record<string, SNNote>
  displayOptions: DisplayOptions
  paginate: () => void
}

export const NotesList: FunctionComponent<Props> = observer(
  ({ application, appState, notes, selectedNotes, displayOptions, paginate }) => {
    const selectNextNote = useCallback(() => appState.notesView.selectNextNote(), [appState])
    const selectPreviousNote = useCallback(() => appState.notesView.selectPreviousNote(), [appState])

    const { hideTags, hideDate, hideNotePreview, hideEditorIcon, sortBy } = displayOptions

    const tagsForNote = useCallback(
      (note: SNNote): string[] => {
        if (hideTags) {
          return []
        }
        const selectedTag = appState.selectedTag
        if (!selectedTag) {
          return []
        }
        const tags = appState.getNoteTags(note)
        if (selectedTag instanceof SNTag && tags.length === 1) {
          return []
        }
        return tags.map((tag) => tag.title).sort()
      },
      [appState, hideTags],
    )

    const openNoteContextMenu = useCallback(
      (posX: number, posY: number) => {
        appState.notes.setContextMenuClickLocation({
          x: posX,
          y: posY,
        })
        appState.notes.reloadContextMenuLayout()
        appState.notes.setContextMenuOpen(true)
      },
      [appState],
    )

    const onContextMenu = useCallback(
      (note: SNNote, posX: number, posY: number) => {
        appState.notes.selectNote(note.uuid, true).catch(console.error)
        openNoteContextMenu(posX, posY)
      },
      [appState, openNoteContextMenu],
    )

    const onScroll = useCallback(
      (e: Event) => {
        const offset = NOTES_LIST_SCROLL_THRESHOLD
        const element = e.target as HTMLElement
        if (element.scrollTop + element.offsetHeight >= element.scrollHeight - offset) {
          paginate()
        }
      },
      [paginate],
    )

    const onKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === KeyboardKey.Up) {
          e.preventDefault()
          selectPreviousNote()
        } else if (e.key === KeyboardKey.Down) {
          e.preventDefault()
          selectNextNote()
        }
      },
      [selectNextNote, selectPreviousNote],
    )

    return (
      <div
        className="infinite-scroll focus:shadow-none focus:outline-none"
        id="notes-scrollable"
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      >
        {notes.map((note) => (
          <NotesListItem
            application={application}
            key={note.uuid}
            note={note}
            tags={tagsForNote(note)}
            selected={!!selectedNotes[note.uuid]}
            hideDate={hideDate}
            hidePreview={hideNotePreview}
            hideTags={hideTags}
            hideEditorIcon={hideEditorIcon}
            sortedBy={sortBy}
            onClick={() => {
              appState.notes.selectNote(note.uuid, true).catch(console.error)
            }}
            onContextMenu={(e: MouseEvent) => {
              e.preventDefault()
              onContextMenu(note, e.clientX, e.clientY)
            }}
          />
        ))}
      </div>
    )
  },
)
