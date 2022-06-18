import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import HistoryModalDialogContent from './HistoryModalDialogContent'
import HistoryModalDialog from './HistoryModalDialog'
import { RevisionHistoryModalProps } from './RevisionHistoryModalProps'

const RevisionHistoryModal: FunctionComponent<RevisionHistoryModalProps> = ({
  application,
  historyModalController,
  notesController,
  selectionController,
  subscriptionController,
}) => {
  if (!historyModalController.note) {
    return null
  }

  return (
    <HistoryModalDialog onDismiss={historyModalController.dismissModal}>
      <HistoryModalDialogContent
        application={application}
        dismissModal={historyModalController.dismissModal}
        note={historyModalController.note}
        notesController={notesController}
        selectionController={selectionController}
        subscriptionController={subscriptionController}
      />
    </HistoryModalDialog>
  )
}

export default observer(RevisionHistoryModal)
