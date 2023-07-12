import RevisionContentLocked from './RevisionContentLocked'
import { observer } from 'mobx-react-lite'
import { NoteHistoryController, RevisionContentState } from '@/Controllers/NoteHistory/NoteHistoryController'
import Spinner from '@/Components/Spinner/Spinner'
import { ReadonlyNoteContent } from '../NoteView/ReadonlyNoteContent'
import { SNNote } from '@standardnotes/snjs'

type Props = {
  noteHistoryController: NoteHistoryController
  note: SNNote
}

const HistoryModalContentPane = ({ noteHistoryController, note }: Props) => {
  const { selectedRevision, contentState } = noteHistoryController

  switch (contentState) {
    case RevisionContentState.Idle:
      return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-sm text-passive-0">
          No revision selected
        </div>
      )
    case RevisionContentState.Loading:
      return <Spinner className="absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2" />
    case RevisionContentState.Loaded:
      if (!selectedRevision) {
        return null
      }
      return <ReadonlyNoteContent note={note} content={selectedRevision.payload.content} showLinkedItems={false} />
    case RevisionContentState.NotEntitled:
      return <RevisionContentLocked />
    default:
      return null
  }
}

export default observer(HistoryModalContentPane)
