import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { RevisionHistoryModalProps, RevisionHistoryModalContent } from './RevisionHistoryModalContent'

const RevisionHistoryModal: FunctionComponent<RevisionHistoryModalProps> = ({ application, viewControllerManager }) => {
  if (!viewControllerManager.notesController.showRevisionHistoryModal) {
    return null
  }

  return <RevisionHistoryModalContent application={application} viewControllerManager={viewControllerManager} />
}

export default observer(RevisionHistoryModal)
