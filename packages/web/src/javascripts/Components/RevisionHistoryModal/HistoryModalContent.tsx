import { getPlatformString } from '@/Utils'
import { DialogContent, DialogOverlay } from '@reach/dialog'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useRef } from 'react'
import HistoryListContainer from './HistoryListContainer'
import { RevisionHistoryModalProps } from './RevisionHistoryModalProps'
import HistoryModalFooter from './HistoryModalFooter'
import HistoryModalContentPane from './HistoryModalContentPane'

const HistoryModalContent: FunctionComponent<RevisionHistoryModalProps> = ({
  application,
  historyModalController,
  notesController,
  subscriptionController,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const { dismissModal } = historyModalController

  return (
    <DialogOverlay
      className={`sn-component ${getPlatformString()}`}
      onDismiss={dismissModal}
      initialFocusRef={closeButtonRef}
      aria-label="Note revision history"
    >
      <DialogContent
        aria-label="Note revision history"
        className="rounded shadow-overlay"
        style={{
          width: '90%',
          maxWidth: '90%',
          minHeight: '90%',
          background: 'var(--modal-background-color)',
        }}
      >
        <div className="bg-default flex flex-col h-full overflow-hidden">
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
        </div>
      </DialogContent>
    </DialogOverlay>
  )
}

export default observer(HistoryModalContent)
