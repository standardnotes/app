import { HistoryModalController } from '@/Controllers/HistoryModalController'
import { observer } from 'mobx-react-lite'
import { RefObject, useCallback } from 'react'
import Button from '../Button/Button'

type Props = {
  historyModalController: HistoryModalController
  closeButtonRef: RefObject<HTMLButtonElement>
}

const HistoryModalFooter = ({ historyModalController, closeButtonRef }: Props) => {
  const { dismissModal, selectedRevision, restoreRevision, restoreRevisionAsCopy } = historyModalController

  const restoreSelectedRevision = useCallback(() => {
    if (selectedRevision) {
      restoreRevision(selectedRevision)
    }
  }, [restoreRevision, selectedRevision])

  const restoreAsCopy = useCallback(async () => {
    if (selectedRevision) {
      void restoreRevisionAsCopy(selectedRevision)
    }
  }, [restoreRevisionAsCopy, selectedRevision])

  const deleteSelectedRevision = useCallback(() => {
    if (!selectedRemoteEntry) {
      return
    }

    application.alertService
      .confirm(
        'Are you sure you want to delete this revision?',
        'Delete revision?',
        'Delete revision',
        ButtonType.Danger,
        'Cancel',
      )
      .then((shouldDelete) => {
        if (shouldDelete && note) {
          setIsDeletingRevision(true)

          application.historyManager
            .deleteRemoteRevision(note, selectedRemoteEntry)
            .then((res) => {
              if (res.error?.message) {
                throw new Error(res.error.message)
              }

              historyModalController.fetchRemoteHistory().catch(console.error)
              setIsDeletingRevision(false)
            })
            .catch(console.error)
        }
      })
      .catch(console.error)
  }, [application.alertService, application.historyManager, historyModalController, note, selectedRemoteEntry])

  return (
    <div className="flex flex-shrink-0 justify-between items-center min-h-6 px-2.5 py-2 border-0 border-t-1px border-solid border-main">
      <div>
        <Button className="py-1.35" label="Close" onClick={dismissModal} ref={closeButtonRef} variant="normal" />
      </div>
      {selectedRevision && (
        <div className="flex items-center">
          {/* {selectedRemoteEntry && (
            <Button className="py-1.35 mr-2.5" onClick={deleteSelectedRevision} variant="normal">
              {isDeletingRevision ? <div className="sk-spinner my-1 w-3 h-3 spinner-info" /> : 'Delete this revision'}
            </Button>
          )} */}
          <Button className="py-1.35 mr-2.5" label="Restore as a copy" onClick={restoreAsCopy} variant="normal" />
          <Button className="py-1.35" label="Restore version" onClick={restoreSelectedRevision} variant="primary" />
        </div>
      )}
    </div>
  )
}

export default observer(HistoryModalFooter)
