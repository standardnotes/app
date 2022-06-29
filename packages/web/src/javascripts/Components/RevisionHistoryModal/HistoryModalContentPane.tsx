import RevisionContentLocked from './RevisionContentLocked'
import SelectedRevisionContent from './SelectedRevisionContent'
import { observer } from 'mobx-react-lite'
import { WebApplication } from '@/Application/Application'
import { NotesController } from '@/Controllers/NotesController'
import { SubscriptionController } from '@/Controllers/Subscription/SubscriptionController'
import { NoteHistoryController, RevisionContentState } from '@/Controllers/NoteHistory/NoteHistoryController'
import Spinner from '@/Components/Spinner/Spinner'

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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-sm text-passive-0">
          No revision selected
        </div>
      )
    case RevisionContentState.Loading:
      return <Spinner className="absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2" />
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
