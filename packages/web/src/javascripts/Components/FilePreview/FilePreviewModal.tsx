import { WebApplication } from '@/Application/Application'
import { DialogContent, DialogOverlay } from '@reach/dialog'
import { FunctionComponent, KeyboardEventHandler, useCallback, useMemo, useRef, useState } from 'react'
import { getFileIconComponent } from './getFileIconComponent'
import Icon from '@/Components/Icon/Icon'
import FilePreviewInfoPanel from './FilePreviewInfoPanel'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { KeyboardKey } from '@standardnotes/ui-services'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
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

  if (!application.isAuthorizedToRenderItem(currentFile)) {
    return null
  }

  const [showFileInfoPanel, setShowFileInfoPanel] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const keyDownHandler: KeyboardEventHandler = useCallback(
    (event) => {
      const KeysToHandle: string[] = [KeyboardKey.Left, KeyboardKey.Right, KeyboardKey.Escape]

      if (!KeysToHandle.includes(event.key)) {
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
        case KeyboardKey.Escape:
          dismiss()
          break
      }
    },
    [currentFile.uuid, dismiss, otherFiles, setCurrentFile],
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
        className="flex min-h-[90%] min-w-[90%] flex-col rounded bg-[color:var(--modal-background-color)] p-0 shadow-main "
      >
        <div
          className="flex h-full w-full flex-col focus:shadow-none focus:outline-none"
          tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
          onKeyDown={keyDownHandler}
        >
          <div className="min-h-6 flex flex-shrink-0 items-center justify-between border-0 border-b border-solid border-border px-4 py-3 focus:shadow-none">
            <div className="flex items-center">
              <div className="h-6 w-6">{IconComponent}</div>
              <span className="ml-3 font-medium">{currentFile.name}</span>
            </div>
            <div className="flex items-center">
              <button
                className="mr-4 flex cursor-pointer rounded border border-solid border-border bg-transparent p-1.5 hover:bg-contrast"
                onClick={() => setShowFileInfoPanel((show) => !show)}
              >
                <Icon type="info" className="text-neutral" />
              </button>
              <button
                ref={closeButtonRef}
                onClick={dismiss}
                aria-label="Close modal"
                className="flex cursor-pointer rounded border-0 bg-transparent p-1 hover:bg-contrast"
              >
                <Icon type="close" className="text-neutral" />
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-grow">
            <div className="relative flex max-w-full flex-grow items-center justify-center">
              <FilePreview file={currentFile} application={application} key={currentFile.uuid} />
            </div>
            {showFileInfoPanel && <FilePreviewInfoPanel file={currentFile} />}
          </div>
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
