import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import HistoryModalContent from './HistoryModalContent'
import { RevisionHistoryModalProps } from './RevisionHistoryModalProps'

const RevisionHistoryModal: FunctionComponent<RevisionHistoryModalProps> = ({
  application,
  viewControllerManager,
  historyModalController,
}) => {
  if (!historyModalController.showRevisionHistoryModal) {
    return null
  }

  return (
    <HistoryModalContent
      application={application}
      viewControllerManager={viewControllerManager}
      historyModalController={historyModalController}
    />
  )
}

export default observer(RevisionHistoryModal)
