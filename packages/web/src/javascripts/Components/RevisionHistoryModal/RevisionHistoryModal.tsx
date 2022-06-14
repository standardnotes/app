import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import RevisionHistoryModalContent from './RevisionHistoryModalContent'
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
    <RevisionHistoryModalContent
      application={application}
      viewControllerManager={viewControllerManager}
      historyModalController={historyModalController}
    />
  )
}

export default observer(RevisionHistoryModal)
