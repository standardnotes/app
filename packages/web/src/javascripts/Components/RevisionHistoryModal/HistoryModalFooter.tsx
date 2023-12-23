import { NoteHistoryController } from '@/Controllers/NoteHistory/NoteHistoryController'
import { RevisionMetadata } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useCallback, useState } from 'react'
import Button from '@/Components/Button/Button'
import Spinner from '@/Components/Spinner/Spinner'

type Props = {
  dismissModal: () => void
  noteHistoryController: NoteHistoryController
  readonly?: boolean
}

const HistoryModalFooter = ({ dismissModal, noteHistoryController, readonly = false }: Props) => {
  const { selectedRevision, restoreRevision, restoreRevisionAsCopy, selectedEntry, deleteRemoteRevision } =
    noteHistoryController

  const [isDeletingRevision, setIsDeletingRevision] = useState(false)

  const restoreSelectedRevision = useCallback(() => {
    if (selectedRevision) {
      void restoreRevision(selectedRevision)
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
    await deleteRemoteRevision(selectedEntry as RevisionMetadata)
    setIsDeletingRevision(false)
  }, [deleteRemoteRevision, selectedEntry])

  return (
    <div className="flex min-h-6 flex-shrink-0 flex-wrap items-center gap-2.5 border-t border-solid border-border px-2.5 py-2 md:justify-between">
      <Button className="py-1.35" label="Close" onClick={dismissModal} />
      {selectedRevision && selectedEntry && !readonly && (
        <>
          {(selectedEntry as RevisionMetadata).uuid && (
            <Button className="md:ml-auto" onClick={deleteSelectedRevision}>
              {isDeletingRevision ? <Spinner className="my-1 h-3 w-3" /> : 'Delete this revision'}
            </Button>
          )}
          <Button
            className={!(selectedEntry as RevisionMetadata).uuid ? 'md:ml-auto' : ''}
            label="Restore as a copy"
            onClick={restoreAsCopy}
          />
          <Button className="" label="Restore version" onClick={restoreSelectedRevision} primary />
        </>
      )}
    </div>
  )
}

export default observer(HistoryModalFooter)
