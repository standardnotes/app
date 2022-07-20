import { WebApplication } from '@/Application/Application'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import AttachedFilesPopover from './AttachedFilesPopover'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { PopoverTabs } from './PopoverTabs'
import { NotesController } from '@/Controllers/NotesController'
import { FilePreviewModalController } from '@/Controllers/FilePreviewModalController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { FilesController } from '@/Controllers/FilesController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { useFileDragNDrop } from '@/Components/FileDragNDropProvider/FileDragNDropProvider'
import { FileItem, SNNote } from '@standardnotes/snjs'
import { addToast, ToastType } from '@standardnotes/toast'
import { classNames } from '@/Utils/ConcatenateClassNames'
import Popover from '../Popover/Popover'

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
  navigationController,
  notesController,
  selectionController,
  onClickPreprocessing,
}: Props) => {
  const { allFiles, attachedFiles } = filesController
  const attachedFilesCount = attachedFiles.length

  const premiumModal = usePremiumModal()
  const note: SNNote | undefined = notesController.firstSelectedNote

  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
    const newOpenState = !isOpen

    if (newOpenState && onClickPreprocessing) {
      await onClickPreprocessing()
    }

    setIsOpen(newOpenState)
  }, [onClickPreprocessing, isOpen])

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
          message: 'Could not attach file because selected note was unselected or deleted',
        })
        return
      }

      await application.items.associateFileWithNote(file, note)
    },
    [application.items, note],
  )

  const { isDraggingFiles, addFilesDragInCallback, addFilesDropCallback } = useFileDragNDrop()

  useEffect(() => {
    if (isDraggingFiles && !isOpen) {
      void toggleAttachedFilesMenu()
    }
  }, [isDraggingFiles, isOpen, toggleAttachedFilesMenu])

  const filesDragInCallback = useCallback((tab: PopoverTabs) => {
    setCurrentTab(tab)
  }, [])

  useEffect(() => {
    addFilesDragInCallback(filesDragInCallback)
  }, [addFilesDragInCallback, filesDragInCallback])

  const filesDropCallback = useCallback(
    (uploadedFiles: FileItem[]) => {
      if (currentTab === PopoverTabs.AttachedFiles) {
        uploadedFiles.forEach((file) => {
          attachFileToNote(file).catch(console.error)
        })
      }
    },
    [attachFileToNote, currentTab],
  )

  useEffect(() => {
    addFilesDropCallback(filesDropCallback)
  }, [addFilesDropCallback, filesDropCallback])

  return (
    <div ref={containerRef}>
      <button
        className={classNames(
          'bg-text-padding flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border text-neutral hover:bg-contrast focus:bg-contrast',
          attachedFilesCount > 0 ? 'py-1 px-3' : '',
        )}
        title="Attached files"
        aria-label="Attached files"
        onClick={toggleAttachedFilesMenuWithEntitlementCheck}
        ref={buttonRef}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setIsOpen(false)
          }
        }}
      >
        <Icon type="attachment-file" />
        {attachedFilesCount > 0 && <span className="ml-2 text-sm">{attachedFilesCount}</span>}
      </button>
      <Popover
        togglePopover={toggleAttachedFilesMenuWithEntitlementCheck}
        anchorElement={buttonRef.current}
        open={isOpen}
        className="pt-2 md:pt-0"
      >
        <AttachedFilesPopover
          application={application}
          filesController={filesController}
          attachedFiles={attachedFiles}
          allFiles={allFiles}
          currentTab={currentTab}
          isDraggingFiles={isDraggingFiles}
          setCurrentTab={setCurrentTab}
          attachedTabDisabled={isAttachedTabDisabled}
        />
      </Popover>
    </div>
  )
}

export default observer(AttachedFilesButton)
