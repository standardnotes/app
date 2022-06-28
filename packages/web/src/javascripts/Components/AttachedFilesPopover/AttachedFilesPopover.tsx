import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { WebApplication } from '@/Application/Application'
import { FileItem } from '@standardnotes/snjs'
import { FilesIllustration } from '@standardnotes/icons'
import { observer } from 'mobx-react-lite'
import { Dispatch, FunctionComponent, SetStateAction, useRef, useState } from 'react'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import PopoverFileItem from './PopoverFileItem'
import { PopoverFileItemActionType } from './PopoverFileItemAction'
import { PopoverTabs } from './PopoverTabs'
import { FilesController } from '@/Controllers/FilesController'

type Props = {
  application: WebApplication
  filesController: FilesController
  allFiles: FileItem[]
  attachedFiles: FileItem[]
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void
  currentTab: PopoverTabs
  isDraggingFiles: boolean
  setCurrentTab: Dispatch<SetStateAction<PopoverTabs>>
  attachedTabDisabled: boolean
}

const AttachedFilesPopover: FunctionComponent<Props> = ({
  application,
  filesController,
  allFiles,
  attachedFiles,
  closeOnBlur,
  currentTab,
  isDraggingFiles,
  setCurrentTab,
  attachedTabDisabled,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filesList = currentTab === PopoverTabs.AttachedFiles ? attachedFiles : allFiles

  const filteredList =
    searchQuery.length > 0
      ? filesList.filter((file) => file.name.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1)
      : filesList

  const handleAttachFilesClick = async () => {
    const uploadedFiles = await filesController.uploadNewFile()
    if (!uploadedFiles) {
      return
    }
    if (currentTab === PopoverTabs.AttachedFiles) {
      uploadedFiles.forEach((file) => {
        filesController
          .handleFileAction({
            type: PopoverFileItemActionType.AttachFileToNote,
            payload: { file },
          })
          .catch(console.error)
      })
    }
  }

  const previewHandler = (file: FileItem) => {
    filesController
      .handleFileAction({
        type: PopoverFileItemActionType.PreviewFile,
        payload: { file, otherFiles: currentTab === PopoverTabs.AllFiles ? allFiles : attachedFiles },
      })
      .catch(console.error)
  }

  return (
    <div
      className="flex flex-col"
      tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      style={{
        border: isDraggingFiles ? '2px dashed var(--sn-stylekit-info-color)' : '',
      }}
    >
      <div className="flex border-b border-solid border-border">
        <button
          id={PopoverTabs.AttachedFiles}
          className={`bg-default border-0 cursor-pointer px-3 py-2.5 relative focus:bg-info-backdrop focus:shadow-bottom text-sm ${
            currentTab === PopoverTabs.AttachedFiles ? 'text-info font-medium shadow-bottom' : 'text-text'
          } ${attachedTabDisabled ? 'text-neutral cursor-not-allowed' : ''}`}
          onClick={() => {
            setCurrentTab(PopoverTabs.AttachedFiles)
          }}
          onBlur={closeOnBlur}
          disabled={attachedTabDisabled}
        >
          Attached
        </button>
        <button
          id={PopoverTabs.AllFiles}
          className={`bg-default border-0 cursor-pointer px-3 py-2.5 relative focus:bg-info-backdrop focus:shadow-bottom text-sm ${
            currentTab === PopoverTabs.AllFiles ? 'text-info font-medium shadow-bottom' : 'text-text'
          }`}
          onClick={() => {
            setCurrentTab(PopoverTabs.AllFiles)
          }}
          onBlur={closeOnBlur}
        >
          All files
        </button>
      </div>
      <div className="min-h-0 max-h-110 overflow-y-auto">
        {filteredList.length > 0 || searchQuery.length > 0 ? (
          <div className="sticky top-0 left-0 p-3 bg-default border-b border-solid border-border">
            <div className="relative">
              <input
                type="text"
                className="text-text w-full rounded py-1.5 px-3 text-sm bg-default border-solid border border-border"
                placeholder="Search files..."
                value={searchQuery}
                onInput={(e) => {
                  setSearchQuery((e.target as HTMLInputElement).value)
                }}
                onBlur={closeOnBlur}
                ref={searchInputRef}
              />
              {searchQuery.length > 0 && (
                <button
                  className="flex absolute right-2 p-0 bg-transparent border-0 top-1/2 -translate-y-1/2 cursor-pointer"
                  onClick={() => {
                    setSearchQuery('')
                    searchInputRef.current?.focus()
                  }}
                  onBlur={closeOnBlur}
                >
                  <Icon type="clear-circle-filled" className="text-neutral" />
                </button>
              )}
            </div>
          </div>
        ) : null}
        {filteredList.length > 0 ? (
          filteredList.map((file: FileItem) => {
            return (
              <PopoverFileItem
                key={file.uuid}
                file={file}
                isAttachedToNote={attachedFiles.includes(file)}
                handleFileAction={filesController.handleFileAction}
                getIconType={application.iconsController.getIconForFileType}
                closeOnBlur={closeOnBlur}
                previewHandler={previewHandler}
              />
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center w-full py-8">
            <div className="w-18 h-18 mb-2">
              <FilesIllustration />
            </div>
            <div className="text-sm font-medium mb-3">
              {searchQuery.length > 0
                ? 'No result found'
                : currentTab === PopoverTabs.AttachedFiles
                ? 'No files attached to this note'
                : 'No files found in this account'}
            </div>
            <Button onClick={handleAttachFilesClick} onBlur={closeOnBlur}>
              {currentTab === PopoverTabs.AttachedFiles ? 'Attach' : 'Upload'} files
            </Button>
            <div className="text-xs text-passive-0 mt-3">Or drop your files here</div>
          </div>
        )}
      </div>
      {filteredList.length > 0 && (
        <button
          className="flex items-center cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-3 text-left w-full focus:bg-info-backdrop focus:shadow-none text-sm border-0 border-t border-solid border-border"
          onClick={handleAttachFilesClick}
          onBlur={closeOnBlur}
        >
          <Icon type="add" className="mr-2 text-neutral" />
          {currentTab === PopoverTabs.AttachedFiles ? 'Attach' : 'Upload'} files
        </button>
      )}
    </div>
  )
}

export default observer(AttachedFilesPopover)
