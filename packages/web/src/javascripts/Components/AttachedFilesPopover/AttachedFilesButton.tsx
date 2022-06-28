import { WebApplication } from '@/Application/Application'
import { MENU_MARGIN_FROM_APP_BORDER } from '@/Constants/Constants'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@reach/disclosure'
import VisuallyHidden from '@reach/visually-hidden'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { FileItem, SNNote } from '@standardnotes/snjs'
import { addToast, ToastType } from '@standardnotes/toast'
import { StreamingFileReader } from '@standardnotes/filepicker'
import AttachedFilesPopover from './AttachedFilesPopover'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { PopoverTabs } from './PopoverTabs'
import { isHandlingFileDrag } from '@/Utils/DragTypeCheck'
import { NotesController } from '@/Controllers/NotesController'
import { FilePreviewModalController } from '@/Controllers/FilePreviewModalController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { FilesController } from '@/Controllers/FilesController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'

type Props = {
  application: WebApplication
  featuresController: FeaturesController
  filePreviewModalController: FilePreviewModalController
  filesController: FilesController
  navigationController: NavigationController
  notesController: NotesController
  selectionController: SelectedItemsController
  onClickPreprocessing?: () => Promise<void>
}

const AttachedFilesButton: FunctionComponent<Props> = ({
  application,
  featuresController,
  filesController,
  filePreviewModalController,
  navigationController,
  notesController,
  selectionController,
  onClickPreprocessing,
}: Props) => {
  const { allFiles, attachedFiles } = filesController
  const attachedFilesCount = attachedFiles.length

  const premiumModal = usePremiumModal()
  const note: SNNote | undefined = notesController.firstSelectedNote

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
    if (filePreviewModalController.isOpen) {
      keepMenuOpen(true)
    } else {
      keepMenuOpen(false)
    }
  }, [filePreviewModalController.isOpen, keepMenuOpen])

  const [currentTab, setCurrentTab] = useState(
    navigationController.isInFilesView ? PopoverTabs.AllFiles : PopoverTabs.AttachedFiles,
  )

  const isAttachedTabDisabled = navigationController.isInFilesView || selectionController.selectedItemsCount > 1

  useEffect(() => {
    if (isAttachedTabDisabled && currentTab === PopoverTabs.AttachedFiles) {
      setCurrentTab(PopoverTabs.AllFiles)
    }
  }, [currentTab, isAttachedTabDisabled])

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
    if (!featuresController.hasFiles) {
      premiumModal.activate('Files')
    }
  }, [featuresController.hasFiles, premiumModal])

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

      if (!featuresController.hasFiles) {
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

          const uploadedFiles = await filesController.uploadNewFile(fileOrHandle)

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
      filesController,
      featuresController.hasFiles,
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
          className={`bg-text-padding flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border text-neutral hover:bg-contrast focus:bg-contrast ${
            attachedFilesCount > 0 ? 'py-1 px-3' : ''
          }`}
          onBlur={closeOnBlur}
        >
          <VisuallyHidden>Attached files</VisuallyHidden>
          <Icon type="attachment-file" className="block" />
          {attachedFilesCount > 0 && <span className="ml-2 text-sm">{attachedFilesCount}</span>}
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
          className="slide-down-animation max-h-120 fixed flex min-w-80 max-w-xs flex-col overflow-y-auto rounded bg-default shadow-main transition-transform duration-150"
          onBlur={closeOnBlur}
        >
          {open && (
            <AttachedFilesPopover
              application={application}
              filesController={filesController}
              attachedFiles={attachedFiles}
              allFiles={allFiles}
              closeOnBlur={closeOnBlur}
              currentTab={currentTab}
              isDraggingFiles={isDraggingFiles}
              setCurrentTab={setCurrentTab}
              attachedTabDisabled={isAttachedTabDisabled}
            />
          )}
        </DisclosurePanel>
      </Disclosure>
    </div>
  )
}

export default observer(AttachedFilesButton)
