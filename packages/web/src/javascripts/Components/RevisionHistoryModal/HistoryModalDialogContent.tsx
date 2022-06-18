import { observer } from 'mobx-react-lite'
import { FunctionComponent, useRef } from 'react'
import HistoryListContainer from './HistoryListContainer'
import { RevisionHistoryModalProps } from './RevisionHistoryModalProps'
import HistoryModalFooter from './HistoryModalFooter'
import HistoryModalContentPane from './HistoryModalContentPane'
import { SNNote } from '@standardnotes/snjs/dist/@types'

const HistoryModalDialogContent: FunctionComponent<
  RevisionHistoryModalProps & {
    note: SNNote
  }
> = ({ application, historyModalController, notesController, subscriptionController }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <div className="flex flex-grow min-h-0">
        <HistoryListContainer features={application.features} historyModalController={historyModalController} />
        <div className="flex flex-col flex-grow relative">
          <HistoryModalContentPane
            application={application}
            historyModalController={historyModalController}
            notesController={notesController}
            subscriptionController={subscriptionController}
          />
        </div>
      </div>
      <HistoryModalFooter historyModalController={historyModalController} closeButtonRef={closeButtonRef} />
    </>
  )
}

export default observer(HistoryModalDialogContent)
