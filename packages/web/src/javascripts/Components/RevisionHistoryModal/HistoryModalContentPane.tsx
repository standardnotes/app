import RevisionContentLocked from './RevisionContentLocked'
import SelectedRevisionContent from './SelectedRevisionContent'
import { observer } from 'mobx-react-lite'
import { WebApplication } from '@/Application/Application'
import { NotesController } from '@/Controllers/NotesController'
import { SubscriptionController } from '@/Controllers/Subscription/SubscriptionController'
import { NoteHistoryController, RevisionContentState } from '@/Controllers/NoteHistory/NoteHistoryController'

type Props = {
  application: WebApplication
  noteHistoryController: NoteHistoryController
  notesController: NotesController
  subscriptionController: SubscriptionController
}

const HistoryModalContentPane = ({
  application,
  noteHistoryController,
  notesController,
  subscriptionController,
}: Props) => {
  const { contentState } = noteHistoryController

  switch (contentState) {
    case RevisionContentState.Idle:
      return (
        <div className="text-sm text-passive-0 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          No revision selected
        </div>
      )
    case RevisionContentState.Loading:
      return (
        <div className="sk-spinner w-5 h-5 spinner-info absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      )
    case RevisionContentState.Loaded:
      return (
        <SelectedRevisionContent
          application={application}
          notesController={notesController}
          noteHistoryController={noteHistoryController}
        />
      )
    case RevisionContentState.NotEntitled:
      return <RevisionContentLocked subscriptionController={subscriptionController} />
    default:
      return null
  }
}

export default observer(HistoryModalContentPane)
