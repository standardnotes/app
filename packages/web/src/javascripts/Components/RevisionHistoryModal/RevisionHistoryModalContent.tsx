import { getPlatformString } from '@/Utils'
import { DialogContent, DialogOverlay } from '@reach/dialog'
import { HistoryEntry } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useRef } from 'react'
import HistoryListContainer from './HistoryListContainer'
import RevisionContentLocked from './RevisionContentLocked'
import SelectedRevisionContent from './SelectedRevisionContent'
import { LegacyHistoryEntry } from './utils'
import { RevisionHistoryModalProps } from './RevisionHistoryModalProps'
import HistoryModalFooter from './HistoryModalFooter'

const ABSOLUTE_CENTER_CLASSNAME = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'

type RevisionContentPlaceholderProps = {
  isFetchingSelectedRevision: boolean
  selectedRevision: HistoryEntry | LegacyHistoryEntry | undefined
  showContentLockedScreen: boolean
}

const RevisionContentPlaceholder: FunctionComponent<RevisionContentPlaceholderProps> = ({
  isFetchingSelectedRevision,
  selectedRevision,
  showContentLockedScreen,
}) => (
  <div
    className={`absolute w-full h-full top-0 left-0 ${
      (isFetchingSelectedRevision || !selectedRevision) && !showContentLockedScreen
        ? 'z-index-1 bg-default'
        : '-z-index-1'
    }`}
  >
    {isFetchingSelectedRevision && <div className={`sk-spinner w-5 h-5 spinner-info ${ABSOLUTE_CENTER_CLASSNAME}`} />}
    {!isFetchingSelectedRevision && !selectedRevision ? (
      <div className={`color-passive-0 select-none ${ABSOLUTE_CENTER_CLASSNAME}`}>No revision selected</div>
    ) : null}
  </div>
)

const RevisionHistoryModalContent: FunctionComponent<RevisionHistoryModalProps> = ({
  application,
  viewControllerManager,
  historyModalController,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const { dismissModal, selectedRevisionWithContent, showContentLockedScreen, isFetchingSelectedRevision } =
    historyModalController

  const note = viewControllerManager.notesController.firstSelectedNote

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
            {note && (
              <HistoryListContainer
                application={application}
                historyModalController={historyModalController}
                note={note}
              />
            )}
            <div className={'flex flex-col flex-grow relative'}>
              <RevisionContentPlaceholder
                selectedRevision={selectedRevisionWithContent}
                isFetchingSelectedRevision={isFetchingSelectedRevision}
                showContentLockedScreen={showContentLockedScreen}
              />
              {showContentLockedScreen && !selectedRevisionWithContent && (
                <RevisionContentLocked viewControllerManager={viewControllerManager} />
              )}
              {selectedRevisionWithContent && (
                <SelectedRevisionContent application={application} viewControllerManager={viewControllerManager} />
              )}
            </div>
          </div>
          <HistoryModalFooter historyModalController={historyModalController} closeButtonRef={closeButtonRef} />
        </div>
      </DialogContent>
    </DialogOverlay>
  )
}

export default observer(RevisionHistoryModalContent)
