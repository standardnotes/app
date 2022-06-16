import RevisionContentLocked from './RevisionContentLocked'
import SelectedRevisionContent from './SelectedRevisionContent'
import { HistoryModalController, RevisionContentState } from '@/Controllers/HistoryModalController'
import { observer } from 'mobx-react-lite'
import { WebApplication } from '@/Application/Application'
import { NotesController } from '@/Controllers/NotesController'
import { SubscriptionController } from '@/Controllers/Subscription/SubscriptionController'

type Props = {
  application: WebApplication
  historyModalController: HistoryModalController
  notesController: NotesController
  subscriptionController: SubscriptionController
}

const HistoryModalContentPane = ({
  application,
  historyModalController,
  notesController,
  subscriptionController,
}: Props) => {
  const { contentState } = historyModalController

  switch (contentState) {
    case RevisionContentState.Idle:
      return (
        <div className="color-passive-0 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
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
          historyModalController={historyModalController}
        />
      )
    case RevisionContentState.Locked:
      return <RevisionContentLocked subscriptionController={subscriptionController} />
    default:
      return null
  }
}

export default observer(HistoryModalContentPane)
