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
import { ChallengeReason, ContentType, FileItem, SNNote } from '@standardnotes/snjs'
import { confirmDialog } from '@/Services/AlertService'
import { addToast, dismissToast, ToastType } from '@standardnotes/stylekit'
import { StreamingFileReader } from '@standardnotes/filepicker'
import { PopoverFileItemAction, PopoverFileItemActionType } from './PopoverFileItemAction'
import { AttachedFilesPopover } from './AttachedFilesPopover'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { PopoverTabs } from './PopoverTabs'
import { isHandlingFileDrag } from '@/Utils/DragTypeCheck'
import { isStateDealloced } from '@/UIModels/AppState/AbstractState'

type Props = {
  application: WebApplication
  appState: AppState
  onClickPreprocessing?: () => Promise<void>
}

export const AttachedFilesButton: FunctionComponent<Props> = observer(
  ({ application, appState, onClickPreprocessing }: Props) => {
    if (isStateDealloced(appState)) {
      return null
    }

    const premiumModal = usePremiumModal()
    const note: SNNote | undefined = Object.values(appState.notes.selectedNotes)[0]

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

    useEffect(() => {
      if (appState.filePreviewModal.isOpen) {
        keepMenuOpen(true)
      } else {
        keepMenuOpen(false)
      }
    }, [appState.filePreviewModal.isOpen, keepMenuOpen])

    const [currentTab, setCurrentTab] = useState(PopoverTabs.AttachedFiles)
    const [allFiles, setAllFiles] = useState<FileItem[]>([])
    const [attachedFiles, setAttachedFiles] = useState<FileItem[]>([])
    const attachedFilesCount = attachedFiles.length

    useEffect(() => {
      const unregisterFileStream = application.streamItems(ContentType.File, () => {
        setAllFiles(application.items.getDisplayableFiles())
        if (note) {
          setAttachedFiles(application.items.getFilesForNote(note))
        }
      })

      return () => {
        unregisterFileStream()
      }
    }, [application, note])

    const toggleAttachedFilesMenu = useCallback(async () => {
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
    }, [onClickPreprocessing, open])

    const prospectivelyShowFilesPremiumModal = useCallback(() => {
      if (!appState.features.hasFiles) {
        premiumModal.activate('Files')
      }
    }, [appState.features.hasFiles, premiumModal])

    const toggleAttachedFilesMenuWithEntitlementCheck = useCallback(async () => {
      prospectivelyShowFilesPremiumModal()

      await toggleAttachedFilesMenu()
    }, [toggleAttachedFilesMenu, prospectivelyShowFilesPremiumModal])

    const deleteFile = async (file: FileItem) => {
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

    const downloadFile = async (file: FileItem) => {
      appState.files.downloadFile(file).catch(console.error)
    }

    const attachFileToNote = useCallback(
      async (file: FileItem) => {
        if (!note) {
          addToast({
            type: ToastType.Error,
            message: 'Could not attach file because selected note was deleted',
          })
          return
        }

        await application.items.associateFileWithNote(file, note)
      },
      [application.items, note],
    )

    const detachFileFromNote = async (file: FileItem) => {
      if (!note) {
        addToast({
          type: ToastType.Error,
          message: 'Could not attach file because selected note was deleted',
        })
        return
      }
      await application.items.disassociateFileWithNote(file, note)
    }

    const toggleFileProtection = async (file: FileItem) => {
      let result: FileItem | undefined
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

    const authorizeProtectedActionForFile = async (file: FileItem, challengeReason: ChallengeReason) => {
      const authorizedFiles = await application.protections.authorizeProtectedActionForFiles([file], challengeReason)
      const isAuthorized = authorizedFiles.length > 0 && authorizedFiles.includes(file)
      return isAuthorized
    }

    const renameFile = async (file: FileItem, fileName: string) => {
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
        case PopoverFileItemActionType.PreviewFile: {
          keepMenuOpen(true)
          const otherFiles = currentTab === PopoverTabs.AllFiles ? allFiles : attachedFiles
          appState.filePreviewModal.activate(
            file,
            otherFiles.filter((file) => !file.protected),
          )
          break
        }
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

    const handleDrag = useCallback(
      (event: DragEvent) => {
        if (isHandlingFileDrag(event, application)) {
          event.preventDefault()
          event.stopPropagation()
        }
      },
      [application],
    )

    const handleDragIn = useCallback(
      (event: DragEvent) => {
        if (!isHandlingFileDrag(event, application)) {
          return
        }

        event.preventDefault()
        event.stopPropagation()

        switch ((event.target as HTMLElement).id) {
          case PopoverTabs.AllFiles:
            setCurrentTab(PopoverTabs.AllFiles)
            break
          case PopoverTabs.AttachedFiles:
            setCurrentTab(PopoverTabs.AttachedFiles)
            break
        }

        dragCounter.current = dragCounter.current + 1

        if (event.dataTransfer?.items.length) {
          setIsDraggingFiles(true)
          if (!open) {
            toggleAttachedFilesMenu().catch(console.error)
          }
        }
      },
      [open, toggleAttachedFilesMenu, application],
    )

    const handleDragOut = useCallback(
      (event: DragEvent) => {
        if (!isHandlingFileDrag(event, application)) {
          return
        }

        event.preventDefault()
        event.stopPropagation()

        dragCounter.current = dragCounter.current - 1

        if (dragCounter.current > 0) {
          return
        }

        setIsDraggingFiles(false)
      },
      [application],
    )

    const handleDrop = useCallback(
      (event: DragEvent) => {
        if (!isHandlingFileDrag(event, application)) {
          return
        }

        event.preventDefault()
        event.stopPropagation()

        setIsDraggingFiles(false)

        if (!appState.features.hasFiles) {
          prospectivelyShowFilesPremiumModal()
          return
        }

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
      [
        appState.files,
        appState.features.hasFiles,
        attachFileToNote,
        currentTab,
        application,
        prospectivelyShowFilesPremiumModal,
      ],
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
    }, [handleDragIn, handleDrop, handleDrag, handleDragOut])

    return (
      <div ref={containerRef}>
        <Disclosure open={open} onChange={toggleAttachedFilesMenuWithEntitlementCheck}>
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
