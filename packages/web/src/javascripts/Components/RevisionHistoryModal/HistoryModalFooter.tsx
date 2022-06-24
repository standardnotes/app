import { NoteHistoryController } from '@/Controllers/NoteHistory/NoteHistoryController'
import { RevisionListEntry } from '@standardnotes/snjs/dist/@types'
import { observer } from 'mobx-react-lite'
import { useCallback, useState } from 'react'
import Button from '../Button/Button'

type Props = {
  dismissModal: () => void
  noteHistoryController: NoteHistoryController
}

const HistoryModalFooter = ({ dismissModal, noteHistoryController }: Props) => {
  const { selectedRevision, restoreRevision, restoreRevisionAsCopy, selectedEntry, deleteRemoteRevision } =
    noteHistoryController

  const [isDeletingRevision, setIsDeletingRevision] = useState(false)

  const restoreSelectedRevision = useCallback(() => {
    if (selectedRevision) {
      restoreRevision(selectedRevision)
      dismissModal()
    }
  }, [dismissModal, restoreRevision, selectedRevision])

  const restoreAsCopy = useCallback(async () => {
    if (selectedRevision) {
      void restoreRevisionAsCopy(selectedRevision)
      dismissModal()
    }
  }, [dismissModal, restoreRevisionAsCopy, selectedRevision])

  const deleteSelectedRevision = useCallback(async () => {
    if (!selectedEntry) {
      return
    }

    setIsDeletingRevision(true)
    await deleteRemoteRevision(selectedEntry as RevisionListEntry)
    setIsDeletingRevision(false)
  }, [deleteRemoteRevision, selectedEntry])

  return (
    <div className="flex flex-shrink-0 justify-between items-center min-h-6 px-2.5 py-2 border-t border-solid border-border">
      <div>
        <Button className="py-1.35" label="Close" onClick={dismissModal} variant="normal" />
      </div>
      {selectedRevision && (
        <div className="flex items-center">
          {(selectedEntry as RevisionListEntry).uuid && (
            <Button className="mr-2.5" onClick={deleteSelectedRevision} variant="normal">
              {isDeletingRevision ? <div className="sk-spinner my-1 w-3 h-3 spinner-info" /> : 'Delete this revision'}
            </Button>
          )}
          <Button className="mr-2.5" label="Restore as a copy" onClick={restoreAsCopy} variant="normal" />
          <Button className="" label="Restore version" onClick={restoreSelectedRevision} variant="primary" />
        </div>
      )}
    </div>
  )
}

export default observer(HistoryModalFooter)
