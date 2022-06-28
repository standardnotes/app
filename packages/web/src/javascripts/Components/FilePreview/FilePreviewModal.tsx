import { WebApplication } from '@/Application/Application'
import { DialogContent, DialogOverlay } from '@reach/dialog'
import { FunctionComponent, KeyboardEventHandler, useCallback, useMemo, useRef, useState } from 'react'
import { getFileIconComponent } from '@/Components/AttachedFilesPopover/getFileIconComponent'
import Icon from '@/Components/Icon/Icon'
import FilePreviewInfoPanel from './FilePreviewInfoPanel'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { KeyboardKey } from '@/Services/IOService'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import FilePreview from './FilePreview'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
}

const FilePreviewModal: FunctionComponent<Props> = observer(({ application, viewControllerManager }) => {
  const { currentFile, setCurrentFile, otherFiles, dismiss } = viewControllerManager.filePreviewModalController

  if (!currentFile) {
    return null
  }

  const [showFileInfoPanel, setShowFileInfoPanel] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const keyDownHandler: KeyboardEventHandler = useCallback(
    (event) => {
      const hasNotPressedLeftOrRightKeys = event.key !== KeyboardKey.Left && event.key !== KeyboardKey.Right

      if (hasNotPressedLeftOrRightKeys) {
        return
      }

      event.preventDefault()

      const currentFileIndex = otherFiles.findIndex((fileFromArray) => fileFromArray.uuid === currentFile.uuid)

      switch (event.key) {
        case KeyboardKey.Left: {
          const previousFileIndex = currentFileIndex - 1 >= 0 ? currentFileIndex - 1 : otherFiles.length - 1
          const previousFile = otherFiles[previousFileIndex]
          if (previousFile) {
            setCurrentFile(previousFile)
          }
          break
        }
        case KeyboardKey.Right: {
          const nextFileIndex = currentFileIndex + 1 < otherFiles.length ? currentFileIndex + 1 : 0
          const nextFile = otherFiles[nextFileIndex]
          if (nextFile) {
            setCurrentFile(nextFile)
          }
          break
        }
      }
    },
    [currentFile.uuid, otherFiles, setCurrentFile],
  )

  const IconComponent = useMemo(
    () =>
      getFileIconComponent(
        application.iconsController.getIconForFileType(currentFile.mimeType),
        'w-6 h-6 flex-shrink-0',
      ),
    [application.iconsController, currentFile.mimeType],
  )

  return (
    <DialogOverlay
      className="sn-component"
      aria-label="File preview modal"
      onDismiss={dismiss}
      initialFocusRef={closeButtonRef}
      dangerouslyBypassScrollLock
    >
      <DialogContent
        aria-label="File preview modal"
        className="flex flex-col rounded shadow-main p-0 min-w-[90%] min-h-[90%] bg-[color:var(--modal-background-color)] "
      >
        <div
          className="flex flex-shrink-0 justify-between items-center min-h-6 px-4 py-3 border-0 border-b border-solid border-border focus:shadow-none"
          tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
          onKeyDown={keyDownHandler}
        >
          <div className="flex items-center">
            <div className="w-6 h-6">{IconComponent}</div>
            <span className="ml-3 font-medium">{currentFile.name}</span>
          </div>
          <div className="flex items-center">
            <button
              className="flex p-1.5 mr-4 bg-transparent hover:bg-contrast border-solid border-border border cursor-pointer rounded"
              onClick={() => setShowFileInfoPanel((show) => !show)}
            >
              <Icon type="info" className="text-neutral" />
            </button>
            <button
              ref={closeButtonRef}
              onClick={dismiss}
              aria-label="Close modal"
              className="flex p-1 bg-transparent hover:bg-contrast border-0 cursor-pointer rounded"
            >
              <Icon type="close" className="text-neutral" />
            </button>
          </div>
        </div>
        <div className="flex flex-grow min-h-0">
          <div className="flex flex-grow items-center justify-center relative max-w-full">
            <FilePreview file={currentFile} application={application} key={currentFile.uuid} />
          </div>
          {showFileInfoPanel && <FilePreviewInfoPanel file={currentFile} />}
        </div>
      </DialogContent>
    </DialogOverlay>
  )
})

FilePreviewModal.displayName = 'FilePreviewModal'

const FilePreviewModalWrapper: FunctionComponent<Props> = ({ application, viewControllerManager }) => {
  return viewControllerManager.filePreviewModalController.isOpen ? (
    <FilePreviewModal application={application} viewControllerManager={viewControllerManager} />
  ) : null
}

export default observer(FilePreviewModalWrapper)
