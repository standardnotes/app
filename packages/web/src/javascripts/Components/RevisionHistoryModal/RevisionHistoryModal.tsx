import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import HistoryModalDialogContent from './HistoryModalDialogContent'
import HistoryModalDialog from './HistoryModalDialog'
import { RevisionHistoryModalProps } from './RevisionHistoryModalProps'

const RevisionHistoryModal: FunctionComponent<RevisionHistoryModalProps> = ({
  application,
  historyModalController,
  notesController,
  subscriptionController,
}) => {
  if (!historyModalController.showRevisionHistoryModal) {
    return null
  }

  return (
    <HistoryModalDialog onDismiss={historyModalController.dismissModal}>
      <HistoryModalDialogContent
        application={application}
        historyModalController={historyModalController}
        note={historyModalController.note}
        notesController={notesController}
        subscriptionController={subscriptionController}
      />
    </HistoryModalDialog>
  )
}

export default observer(RevisionHistoryModal)
