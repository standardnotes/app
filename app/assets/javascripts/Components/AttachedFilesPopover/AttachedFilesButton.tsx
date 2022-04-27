import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { MENU_MARGIN_FROM_APP_BORDER } from '@/Constants'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@reach/disclosure'
import VisuallyHidden from '@reach/visually-hidden'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { Icon } from '@/Components/Icon'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { ChallengeReason, CollectionSort, ContentType, SNFile } from '@standardnotes/snjs'
import { confirmDialog } from '@/Services/AlertService'
import { addToast, dismissToast, ToastType } from '@standardnotes/stylekit'
import { StreamingFileReader } from '@standardnotes/filepicker'
import { PopoverFileItemAction, PopoverFileItemActionType } from './PopoverFileItemAction'
import { AttachedFilesPopover, PopoverTabs } from './AttachedFilesPopover'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { useFilePreviewModal } from '../Files/FilePreviewModalProvider'

type Props = {
  application: WebApplication
  appState: AppState
  onClickPreprocessing?: () => Promise<void>
}

const createDragOverlay = () => {
  if (document.getElementById('drag-overlay')) {
    return
  }

  const overlayElementTemplate =
    '<div class="sn-component" id="drag-overlay"><div class="absolute top-0 left-0 w-full h-full z-index-1001"></div></div>'
  const overlayFragment = document.createRange().createContextualFragment(overlayElementTemplate)
  document.body.appendChild(overlayFragment)
}

const removeDragOverlay = () => {
  document.getElementById('drag-overlay')?.remove()
}

const isHandlingFileDrag = (event: DragEvent) =>
  event.dataTransfer?.items && Array.from(event.dataTransfer.items).some((item) => item.kind === 'file')

export const AttachedFilesButton: FunctionComponent<Props> = observer(
  ({ application, appState, onClickPreprocessing }) => {
    const premiumModal = usePremiumModal()
    const filePreviewModal = useFilePreviewModal()

    const note = Object.values(appState.notes.selectedNotes)[0]

    const [open, setOpen] = useState(false)
    const [position, setPosition] = useState({
      top: 0,
      right: 0,
    })
    const [maxHeight, setMaxHeight] = useState<number | 'auto'>('auto')
    const buttonRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [closeOnBlur, keepMenuOpen] = useCloseOnBlur(containerRef, setOpen)

    const [currentTab, setCurrentTab] = useState(PopoverTabs.AttachedFiles)
    const [allFiles, setAllFiles] = useState<SNFile[]>([])
    const [attachedFiles, setAttachedFiles] = useState<SNFile[]>([])
    const attachedFilesCount = attachedFiles.length

    useEffect(() => {
      application.items.setDisplayOptions(ContentType.File, CollectionSort.Title, 'dsc')

      const unregisterFileStream = application.streamItems(ContentType.File, () => {
        setAllFiles(application.items.getDisplayableItems<SNFile>(ContentType.File))
        setAttachedFiles(application.items.getFilesForNote(note))
      })

      return () => {
        unregisterFileStream()
      }
    }, [application, note])

    const toggleAttachedFilesMenu = useCallback(async () => {
      if (!appState.features.isEntitledToFiles) {
        premiumModal.activate('Files')
        return
      }

      const rect = buttonRef.current?.getBoundingClientRect()
      if (rect) {
        const { clientHeight } = document.documentElement
        const footerElementRect = document.getElementById('footer-bar')?.getBoundingClientRect()
        const footerHeightInPx = footerElementRect?.height

        if (footerHeightInPx) {
          setMaxHeight(clientHeight - rect.bottom - footerHeightInPx - MENU_MARGIN_FROM_APP_BORDER)
        }

        setPosition({
          top: rect.bottom,
          right: document.body.clientWidth - rect.right,
        })

        const newOpenState = !open
        if (newOpenState && onClickPreprocessing) {
          await onClickPreprocessing()
        }

        setOpen(newOpenState)
      }
    }, [appState.features.isEntitledToFiles, onClickPreprocessing, open, premiumModal])

    const deleteFile = async (file: SNFile) => {
      const shouldDelete = await confirmDialog({
        text: `Are you sure you want to permanently delete "${file.name}"?`,
        confirmButtonStyle: 'danger',
      })
      if (shouldDelete) {
        const deletingToastId = addToast({
          type: ToastType.Loading,
          message: `Deleting file "${file.name}"...`,
        })
        await application.files.deleteFile(file)
        addToast({
          type: ToastType.Success,
          message: `Deleted file "${file.name}"`,
        })
        dismissToast(deletingToastId)
      }
    }

    const downloadFile = async (file: SNFile) => {
      appState.files.downloadFile(file).catch(console.error)
    }

    const attachFileToNote = useCallback(
      async (file: SNFile) => {
        await application.items.associateFileWithNote(file, note)
      },
      [application.items, note],
    )

    const detachFileFromNote = async (file: SNFile) => {
      await application.items.disassociateFileWithNote(file, note)
    }

    const toggleFileProtection = async (file: SNFile) => {
      let result: SNFile | undefined
      if (file.protected) {
        keepMenuOpen(true)
        result = await application.mutator.unprotectFile(file)
        keepMenuOpen(false)
        buttonRef.current?.focus()
      } else {
        result = await application.mutator.protectFile(file)
      }
      const isProtected = result ? result.protected : file.protected
      return isProtected
    }

    const authorizeProtectedActionForFile = async (file: SNFile, challengeReason: ChallengeReason) => {
      const authorizedFiles = await application.protections.authorizeProtectedActionForFiles([file], challengeReason)
      const isAuthorized = authorizedFiles.length > 0 && authorizedFiles.includes(file)
      return isAuthorized
    }

    const renameFile = async (file: SNFile, fileName: string) => {
      await application.items.renameFile(file, fileName)
    }

    const handleFileAction = async (action: PopoverFileItemAction) => {
      const file = action.type !== PopoverFileItemActionType.RenameFile ? action.payload : action.payload.file
      let isAuthorizedForAction = true

      if (file.protected && action.type !== PopoverFileItemActionType.ToggleFileProtection) {
        keepMenuOpen(true)
        isAuthorizedForAction = await authorizeProtectedActionForFile(file, ChallengeReason.AccessProtectedFile)
        keepMenuOpen(false)
        buttonRef.current?.focus()
      }

      if (!isAuthorizedForAction) {
        return false
      }

      switch (action.type) {
        case PopoverFileItemActionType.AttachFileToNote:
          await attachFileToNote(file)
          break
        case PopoverFileItemActionType.DetachFileToNote:
          await detachFileFromNote(file)
          break
        case PopoverFileItemActionType.DeleteFile:
          await deleteFile(file)
          break
        case PopoverFileItemActionType.DownloadFile:
          await downloadFile(file)
          break
        case PopoverFileItemActionType.ToggleFileProtection: {
          const isProtected = await toggleFileProtection(file)
          action.callback(isProtected)
          break
        }
        case PopoverFileItemActionType.RenameFile:
          await renameFile(file, action.payload.name)
          break
        case PopoverFileItemActionType.PreviewFile:
          filePreviewModal.activate(file, currentTab === PopoverTabs.AllFiles ? allFiles : attachedFiles)
          break
      }

      if (
        action.type !== PopoverFileItemActionType.DownloadFile &&
        action.type !== PopoverFileItemActionType.PreviewFile
      ) {
        application.sync.sync().catch(console.error)
      }

      return true
    }

    const [isDraggingFiles, setIsDraggingFiles] = useState(false)
    const dragCounter = useRef(0)

    const handleDrag = (event: DragEvent) => {
      if (isHandlingFileDrag(event)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    const handleDragIn = useCallback(
      (event: DragEvent) => {
        if (!isHandlingFileDrag(event)) {
          return
        }

        event.preventDefault()
        event.stopPropagation()

        dragCounter.current = dragCounter.current + 1

        if (event.dataTransfer?.items.length) {
          setIsDraggingFiles(true)
          createDragOverlay()
          if (!open) {
            toggleAttachedFilesMenu().catch(console.error)
          }
        }
      },
      [open, toggleAttachedFilesMenu],
    )

    const handleDragOut = (event: DragEvent) => {
      if (!isHandlingFileDrag(event)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      dragCounter.current = dragCounter.current - 1

      if (dragCounter.current > 0) {
        return
      }

      removeDragOverlay()

      setIsDraggingFiles(false)
    }

    const handleDrop = useCallback(
      (event: DragEvent) => {
        if (!isHandlingFileDrag(event)) {
          return
        }

        event.preventDefault()
        event.stopPropagation()

        setIsDraggingFiles(false)
        removeDragOverlay()

        if (event.dataTransfer?.items.length) {
          Array.from(event.dataTransfer.items).forEach(async (item) => {
            const fileOrHandle = StreamingFileReader.available()
              ? ((await item.getAsFileSystemHandle()) as FileSystemFileHandle)
              : item.getAsFile()

            if (!fileOrHandle) {
              return
            }

            const uploadedFiles = await appState.files.uploadNewFile(fileOrHandle)

            if (!uploadedFiles) {
              return
            }

            if (currentTab === PopoverTabs.AttachedFiles) {
              uploadedFiles.forEach((file) => {
                attachFileToNote(file).catch(console.error)
              })
            }
          })

          event.dataTransfer.clearData()
          dragCounter.current = 0
        }
      },
      [appState.files, attachFileToNote, currentTab],
    )

    useEffect(() => {
      window.addEventListener('dragenter', handleDragIn)
      window.addEventListener('dragleave', handleDragOut)
      window.addEventListener('dragover', handleDrag)
      window.addEventListener('drop', handleDrop)

      return () => {
        window.removeEventListener('dragenter', handleDragIn)
        window.removeEventListener('dragleave', handleDragOut)
        window.removeEventListener('dragover', handleDrag)
        window.removeEventListener('drop', handleDrop)
      }
    }, [handleDragIn, handleDrop])

    return (
      <div ref={containerRef}>
        <Disclosure open={open} onChange={toggleAttachedFilesMenu}>
          <DisclosureButton
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setOpen(false)
              }
            }}
            ref={buttonRef}
            className={`sn-icon-button border-contrast ${attachedFilesCount > 0 ? 'py-1 px-3' : ''}`}
            onBlur={closeOnBlur}
          >
            <VisuallyHidden>Attached files</VisuallyHidden>
            <Icon type="attachment-file" className="block" />
            {attachedFilesCount > 0 && <span className="ml-2">{attachedFilesCount}</span>}
          </DisclosureButton>
          <DisclosurePanel
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setOpen(false)
                buttonRef.current?.focus()
              }
            }}
            ref={panelRef}
            style={{
              ...position,
              maxHeight,
            }}
            className="sn-dropdown sn-dropdown--animated min-w-80 max-h-120 max-w-xs flex flex-col overflow-y-auto fixed"
            onBlur={closeOnBlur}
          >
            {open && (
              <AttachedFilesPopover
                application={application}
                appState={appState}
                attachedFiles={attachedFiles}
                allFiles={allFiles}
                closeOnBlur={closeOnBlur}
                currentTab={currentTab}
                handleFileAction={handleFileAction}
                isDraggingFiles={isDraggingFiles}
                setCurrentTab={setCurrentTab}
              />
            )}
          </DisclosurePanel>
        </Disclosure>
      </div>
    )
  },
)
