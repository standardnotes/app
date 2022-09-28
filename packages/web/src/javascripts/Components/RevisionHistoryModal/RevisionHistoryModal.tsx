import { observer } from 'mobx-react-lite'
import { FunctionComponent, useEffect } from 'react'
import HistoryModalDialogContent from './HistoryModalDialogContent'
import HistoryModalDialog from './HistoryModalDialog'
import { RevisionHistoryModalProps } from './RevisionHistoryModalProps'
import { useAndroidBackHandler } from '@/NativeMobileWeb/useAndroidBackHandler'

const RevisionHistoryModal: FunctionComponent<RevisionHistoryModalProps> = ({
  application,
  historyModalController,
  notesController,
  selectionController,
  subscriptionController,
}) => {
  const addAndroidBackHandler = useAndroidBackHandler()

  const isOpen = !!historyModalController.note

  useEffect(() => {
    let removeListener: (() => void) | undefined

    if (isOpen) {
      removeListener = addAndroidBackHandler(() => {
        historyModalController.dismissModal()
        return true
      })
    }

    return () => {
      if (removeListener) {
        removeListener()
      }
    }
  }, [addAndroidBackHandler, historyModalController, isOpen])

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
