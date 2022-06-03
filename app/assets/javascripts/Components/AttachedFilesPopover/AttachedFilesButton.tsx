import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { MENU_MARGIN_FROM_APP_BORDER } from '@/Constants/Constants'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@reach/disclosure'
import VisuallyHidden from '@reach/visually-hidden'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { ContentType, FileItem, SNNote } from '@standardnotes/snjs'
import { addToast, ToastType } from '@standardnotes/stylekit'
import { StreamingFileReader } from '@standardnotes/filepicker'
import AttachedFilesPopover from './AttachedFilesPopover'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { PopoverTabs } from './PopoverTabs'
import { isHandlingFileDrag } from '@/Utils/DragTypeCheck'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
  onClickPreprocessing?: () => Promise<void>
}

const AttachedFilesButton: FunctionComponent<Props> = ({
  application,
  viewControllerManager,
  onClickPreprocessing,
}: Props) => {
  const premiumModal = usePremiumModal()
  const note: SNNote | undefined = viewControllerManager.notesController.firstSelectedNote

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
    if (viewControllerManager.filePreviewModalController.isOpen) {
      keepMenuOpen(true)
    } else {
      keepMenuOpen(false)
    }
  }, [viewControllerManager.filePreviewModalController.isOpen, keepMenuOpen])

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
    if (!viewControllerManager.featuresController.hasFiles) {
      premiumModal.activate('Files')
    }
  }, [viewControllerManager.featuresController.hasFiles, premiumModal])

  const toggleAttachedFilesMenuWithEntitlementCheck = useCallback(async () => {
    prospectivelyShowFilesPremiumModal()

    await toggleAttachedFilesMenu()
  }, [toggleAttachedFilesMenu, prospectivelyShowFilesPremiumModal])

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

      if (!viewControllerManager.featuresController.hasFiles) {
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

          const uploadedFiles = await viewControllerManager.filesController.uploadNewFile(fileOrHandle)

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
      viewControllerManager.filesController,
      viewControllerManager.featuresController.hasFiles,
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
              filesController={viewControllerManager.filesController}
              attachedFiles={attachedFiles}
              allFiles={allFiles}
              closeOnBlur={closeOnBlur}
              currentTab={currentTab}
              isDraggingFiles={isDraggingFiles}
              setCurrentTab={setCurrentTab}
            />
          )}
        </DisclosurePanel>
      </Disclosure>
    </div>
  )
}

export default observer(AttachedFilesButton)
