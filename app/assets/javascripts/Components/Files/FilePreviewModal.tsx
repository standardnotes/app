import { WebApplication } from '@/UIModels/Application'
import { concatenateUint8Arrays } from '@/Utils/ConcatenateUint8Arrays'
import { DialogContent, DialogOverlay } from '@reach/dialog'
import { addToast, NoPreviewIllustration, ToastType } from '@standardnotes/stylekit'
import { FunctionComponent } from 'preact'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { getFileIconComponent } from '@/Components/AttachedFilesPopover/PopoverFileItem'
import { Button } from '@/Components/Button/Button'
import { Icon } from '@/Components/Icon'
import { FilePreviewInfoPanel } from './FilePreviewInfoPanel'
import { isFileTypePreviewable } from './isFilePreviewable'
import { PreviewComponent } from './PreviewComponent'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants'
import { KeyboardKey } from '@/Services/IOService'
import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'

type Props = {
  application: WebApplication
  appState: AppState
}

export const FilePreviewModal: FunctionComponent<Props> = observer(({ application, appState }) => {
  const { currentFile, setCurrentFile, otherFiles, dismiss, isOpen } = appState.filePreviewModal

  if (!currentFile || !isOpen) {
    return null
  }

  const [objectUrl, setObjectUrl] = useState<string>()
  const [isFilePreviewable, setIsFilePreviewable] = useState(false)
  const [isLoadingFile, setIsLoadingFile] = useState(true)
  const [fileDownloadProgress, setFileDownloadProgress] = useState(0)
  const [showFileInfoPanel, setShowFileInfoPanel] = useState(false)
  const currentFileIdRef = useRef<string>()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const getObjectUrl = useCallback(async () => {
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
      setObjectUrl(
        URL.createObjectURL(
          new Blob([finalDecryptedBytes], {
            type: currentFile.mimeType,
          }),
        ),
      )
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
      setObjectUrl('')
      setIsLoadingFile(false)
    }

    if (currentFileIdRef.current !== currentFile.uuid && isPreviewable) {
      getObjectUrl().catch(console.error)
    }

    currentFileIdRef.current = currentFile.uuid

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [currentFile, getObjectUrl, objectUrl])

  const keyDownHandler = (event: KeyboardEvent) => {
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
  }

  return (
    <DialogOverlay
      className="sn-component"
      aria-label="File preview modal"
      onDismiss={dismiss}
      initialFocusRef={closeButtonRef}
      dangerouslyBypassScrollLock
    >
      <DialogContent
        className="flex flex-col rounded shadow-overlay"
        style={{
          width: '90%',
          maxWidth: '90%',
          minHeight: '90%',
          background: 'var(--sn-stylekit-background-color)',
        }}
      >
        <div
          className="flex flex-shrink-0 justify-between items-center min-h-6 px-4 py-3 border-0 border-b-1 border-solid border-main focus:shadow-none"
          tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
          onKeyDown={keyDownHandler}
        >
          <div className="flex items-center">
            <div className="w-6 h-6">
              {getFileIconComponent(
                application.iconsController.getIconForFileType(currentFile.mimeType),
                'w-6 h-6 flex-shrink-0',
              )}
            </div>
            <span className="ml-3 font-medium">{currentFile.name}</span>
          </div>
          <div className="flex items-center">
            <button
              className="flex p-1.5 mr-4 bg-transparent hover:bg-contrast border-solid border-main border-1 cursor-pointer rounded"
              onClick={() => setShowFileInfoPanel((show) => !show)}
            >
              <Icon type="info" className="color-neutral" />
            </button>
            {objectUrl && (
              <Button
                variant="primary"
                className="mr-4"
                onClick={() => {
                  application.getArchiveService().downloadData(objectUrl, currentFile.name)
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
            ) : objectUrl ? (
              <PreviewComponent file={currentFile} objectUrl={objectUrl} />
            ) : (
              <div className="flex flex-col items-center">
                <NoPreviewIllustration className="w-30 h-30 mb-4" />
                <div className="font-bold text-base mb-2">This file can't be previewed.</div>
                {isFilePreviewable ? (
                  <>
                    <div className="text-sm text-center color-grey-0 mb-4 max-w-35ch">
                      There was an error loading the file. Try again, or download the file and open it using another
                      application.
                    </div>
                    <div className="flex items-center">
                      <Button
                        variant="primary"
                        className="mr-3"
                        onClick={() => {
                          getObjectUrl().catch(console.error)
                        }}
                      >
                        Try again
                      </Button>
                      <Button
                        variant="normal"
                        onClick={() => {
                          application.getAppState().files.downloadFile(currentFile).catch(console.error)
                        }}
                      >
                        Download
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-center color-grey-0 mb-4 max-w-35ch">
                      To view this file, download it and open it using another application.
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => {
                        application.getAppState().files.downloadFile(currentFile).catch(console.error)
                      }}
                    >
                      Download
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
          {showFileInfoPanel && <FilePreviewInfoPanel file={currentFile} />}
        </div>
      </DialogContent>
    </DialogOverlay>
  )
})
