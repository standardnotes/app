import { WebApplication } from '@/Application/Application'
import { concatenateUint8Arrays } from '@/Utils/ConcatenateUint8Arrays'
import { DialogContent, DialogOverlay } from '@reach/dialog'
import { addToast, ToastType } from '@standardnotes/stylekit'
import { FunctionComponent, KeyboardEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getFileIconComponent } from '@/Components/AttachedFilesPopover/getFileIconComponent'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import FilePreviewInfoPanel from './FilePreviewInfoPanel'
import { isFileTypePreviewable } from './isFilePreviewable'
import PreviewComponent from './PreviewComponent'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { KeyboardKey } from '@/Services/IOService'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import FilePreviewError from './FilePreviewError'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
}

const FilePreviewModal: FunctionComponent<Props> = observer(({ application, viewControllerManager }) => {
  const { currentFile, setCurrentFile, otherFiles, dismiss } = viewControllerManager.filePreviewModalController

  if (!currentFile) {
    return null
  }

  const [downloadedBytes, setDownloadedBytes] = useState<Uint8Array>()
  const [isFilePreviewable, setIsFilePreviewable] = useState(false)
  const [isLoadingFile, setIsLoadingFile] = useState(true)
  const [fileDownloadProgress, setFileDownloadProgress] = useState(0)
  const [showFileInfoPanel, setShowFileInfoPanel] = useState(false)
  const currentFileIdRef = useRef<string>()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const downloadFile = useCallback(async () => {
    try {
      const chunks: Uint8Array[] = []
      setFileDownloadProgress(0)
      await application.files.downloadFile(currentFile, async (decryptedChunk, progress) => {
        chunks.push(decryptedChunk)
        if (progress) {
          setFileDownloadProgress(Math.round(progress.percentComplete))
        }
      })
      const finalDecryptedBytes = concatenateUint8Arrays(chunks)
      setDownloadedBytes(finalDecryptedBytes)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoadingFile(false)
    }
  }, [application.files, currentFile])

  useEffect(() => {
    setIsLoadingFile(true)
  }, [currentFile.uuid])

  useEffect(() => {
    const isPreviewable = isFileTypePreviewable(currentFile.mimeType)
    setIsFilePreviewable(isPreviewable)

    if (!isPreviewable) {
      setDownloadedBytes(undefined)
      setIsLoadingFile(false)
    }

    if (currentFileIdRef.current !== currentFile.uuid && isPreviewable) {
      downloadFile().catch(console.error)
    }

    currentFileIdRef.current = currentFile.uuid
  }, [currentFile, downloadFile, downloadedBytes])

  const keyDownHandler: KeyboardEventHandler = useCallback(
    (event) => {
      if (event.key !== KeyboardKey.Left && event.key !== KeyboardKey.Right) {
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
        className="flex flex-col rounded shadow-overlay"
        style={{
          width: '90%',
          maxWidth: '90%',
          minHeight: '90%',
          background: 'var(--modal-background-color)',
        }}
      >
        <div
          className="flex flex-shrink-0 justify-between items-center min-h-6 px-4 py-3 border-0 border-b-1 border-solid border-main focus:shadow-none"
          tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
          onKeyDown={keyDownHandler}
        >
          <div className="flex items-center">
            <div className="w-6 h-6">{IconComponent}</div>
            <span className="ml-3 font-medium">{currentFile.name}</span>
          </div>
          <div className="flex items-center">
            <button
              className="flex p-1.5 mr-4 bg-transparent hover:bg-contrast border-solid border-main border-1 cursor-pointer rounded"
              onClick={() => setShowFileInfoPanel((show) => !show)}
            >
              <Icon type="info" className="color-neutral" />
            </button>
            {downloadedBytes && (
              <Button
                variant="primary"
                className="mr-4"
                onClick={() => {
                  void viewControllerManager.filesController.downloadFile(currentFile)
                  addToast({
                    type: ToastType.Success,
                    message: 'Successfully downloaded file',
                  })
                }}
              >
                Download
              </Button>
            )}
            <button
              ref={closeButtonRef}
              onClick={dismiss}
              aria-label="Close modal"
              className="flex p-1 bg-transparent hover:bg-contrast border-0 cursor-pointer rounded"
            >
              <Icon type="close" className="color-neutral" />
            </button>
          </div>
        </div>
        <div className="flex flex-grow min-h-0">
          <div className="flex flex-grow items-center justify-center relative max-w-full">
            {isLoadingFile ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center">
                  <div className="sk-spinner w-5 h-5 spinner-info mr-3"></div>
                  <div className="text-base font-semibold">{fileDownloadProgress}%</div>
                </div>
                <span className="mt-3">Loading file...</span>
              </div>
            ) : downloadedBytes ? (
              <PreviewComponent file={currentFile} bytes={downloadedBytes} />
            ) : (
              <FilePreviewError
                application={application}
                file={currentFile}
                isFilePreviewable={isFilePreviewable}
                tryAgainCallback={() => {
                  void downloadFile()
                }}
              />
            )}
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
