import { NoteHistoryController } from '@/Controllers/NoteHistory/NoteHistoryController'
import { RevisionListEntry } from '@standardnotes/snjs/dist/@types'
import { observer } from 'mobx-react-lite'
import { useCallback, useState } from 'react'
import Button from '@/Components/Button/Button'
import Spinner from '@/Components/Spinner/Spinner'

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
        <Button className="py-1.35" label="Close" onClick={dismissModal} />
      </div>
      {selectedRevision && (
        <div className="flex items-center">
          {(selectedEntry as RevisionListEntry).uuid && (
            <Button className="mr-2.5" onClick={deleteSelectedRevision}>
              {isDeletingRevision ? <Spinner className="w-3 h-3 my-1" /> : 'Delete this revision'}
            </Button>
          )}
          <Button className="mr-2.5" label="Restore as a copy" onClick={restoreAsCopy} />
          <Button className="" label="Restore version" onClick={restoreSelectedRevision} primary />
        </div>
      )}
    </div>
  )
}

export default observer(HistoryModalFooter)
