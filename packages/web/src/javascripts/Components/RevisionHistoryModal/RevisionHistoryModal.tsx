import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import HistoryModalContent from './HistoryModalContent'
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
    <HistoryModalContent
      application={application}
      historyModalController={historyModalController}
      notesController={notesController}
      subscriptionController={subscriptionController}
    />
  )
}

export default observer(RevisionHistoryModal)
