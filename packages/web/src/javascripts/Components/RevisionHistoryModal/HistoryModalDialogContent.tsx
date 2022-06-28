import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import HistoryListContainer from './HistoryListContainer'
import { RevisionHistoryModalContentProps } from './RevisionHistoryModalProps'
import HistoryModalFooter from './HistoryModalFooter'
import HistoryModalContentPane from './HistoryModalContentPane'
import { NoteHistoryController } from '@/Controllers/NoteHistory/NoteHistoryController'

const HistoryModalDialogContent = ({
  application,
  dismissModal,
  notesController,
  subscriptionController,
  note,
  selectionController,
}: RevisionHistoryModalContentProps) => {
  const [noteHistoryController] = useState(() => new NoteHistoryController(application, note, selectionController))

  return (
    <>
      <div className="flex min-h-0 flex-grow">
        <HistoryListContainer features={application.features} noteHistoryController={noteHistoryController} />
        <div className="relative flex flex-grow flex-col">
          <HistoryModalContentPane
            application={application}
            noteHistoryController={noteHistoryController}
            notesController={notesController}
            subscriptionController={subscriptionController}
          />
        </div>
      </div>
      <HistoryModalFooter dismissModal={dismissModal} noteHistoryController={noteHistoryController} />
    </>
  )
}

export default observer(HistoryModalDialogContent)
