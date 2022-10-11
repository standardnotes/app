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
import { StreamingFileReader } from '@standardnotes/filepicker'
import ClearInputButton from '../ClearInputButton/ClearInputButton'
import DecoratedInput from '../Input/DecoratedInput'

type Props = {
  application: WebApplication
  filesController: FilesController
  allFiles: FileItem[]
  attachedFiles: FileItem[]
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
  currentTab,
  isDraggingFiles,
  setCurrentTab,
  attachedTabDisabled,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filesList = currentTab === PopoverTabs.AttachedFiles ? attachedFiles : allFiles

  const filteredList =
    searchQuery.length > 0
      ? filesList.filter((file) => file.name.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1)
      : filesList

  const attachFilesIfRequired = (files: FileItem[]) => {
    if (currentTab === PopoverTabs.AttachedFiles) {
      files.forEach((file) => {
        filesController
          .handleFileAction({
            type: PopoverFileItemActionType.AttachFileToNote,
            payload: { file },
          })
          .catch(console.error)
      })
    }
  }

  const handleAttachFilesClick = async () => {
    if (!StreamingFileReader.available()) {
      fileInputRef.current?.click()
      return
    }

    const uploadedFiles = await filesController.uploadNewFile()
    if (!uploadedFiles) {
      return
    }
    attachFilesIfRequired(uploadedFiles)
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
          className={`relative cursor-pointer border-0 bg-default px-3 py-2.5 text-sm focus:bg-info-backdrop focus:shadow-bottom ${
            currentTab === PopoverTabs.AttachedFiles ? 'font-medium text-info shadow-bottom' : 'text-text'
          } ${attachedTabDisabled ? 'cursor-not-allowed text-neutral' : ''}`}
          onClick={() => {
            setCurrentTab(PopoverTabs.AttachedFiles)
          }}
          disabled={attachedTabDisabled}
        >
          Attached
        </button>
        <button
          id={PopoverTabs.AllFiles}
          className={`relative cursor-pointer border-0 bg-default px-3 py-2.5 text-sm focus:bg-info-backdrop focus:shadow-bottom ${
            currentTab === PopoverTabs.AllFiles ? 'font-medium text-info shadow-bottom' : 'text-text'
          }`}
          onClick={() => {
            setCurrentTab(PopoverTabs.AllFiles)
          }}
        >
          All files
        </button>
      </div>
      <div className="max-h-110 min-h-0 overflow-y-auto">
        {filteredList.length > 0 || searchQuery.length > 0 ? (
          <div className="sticky top-0 left-0 border-b border-solid border-border bg-default p-3">
            <DecoratedInput
              type="text"
              className={{ container: searchQuery.length < 1 ? 'py-1.5 px-0.5' : 'py-0' }}
              placeholder="Search items..."
              value={searchQuery}
              onChange={setSearchQuery}
              ref={searchInputRef}
              right={[
                searchQuery.length > 0 && (
                  <ClearInputButton
                    onClick={() => {
                      setSearchQuery('')
                      searchInputRef.current?.focus()
                    }}
                  />
                ),
              ]}
            />
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
                previewHandler={previewHandler}
              />
            )
          })
        ) : (
          <div className="flex w-full flex-col items-center justify-center py-8">
            <div className="mb-2 h-18 w-18">
              <FilesIllustration />
            </div>
            <div className="mb-3 text-sm font-medium">
              {searchQuery.length > 0
                ? 'No result found'
                : currentTab === PopoverTabs.AttachedFiles
                ? 'No files attached to this note'
                : 'No files found in this account'}
            </div>
            <Button onClick={handleAttachFilesClick}>
              {currentTab === PopoverTabs.AttachedFiles ? 'Attach' : 'Upload'} files
            </Button>
            <div className="mt-3 text-xs text-passive-0">Or drop your files here</div>
          </div>
        )}
      </div>
      <input
        type="file"
        className="absolute top-0 left-0 -z-50 h-px w-px opacity-0"
        multiple
        ref={fileInputRef}
        onChange={async (event) => {
          const files = event.currentTarget.files

          if (!files) {
            return
          }

          for (const file of files) {
            const uploadedFiles = await filesController.uploadNewFile(file)
            if (uploadedFiles) {
              attachFilesIfRequired(uploadedFiles)
            }
          }
        }}
      />
      {filteredList.length > 0 && (
        <button
          className="flex w-full cursor-pointer items-center border-0 border-t border-solid border-border bg-transparent px-3 py-3 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
          onClick={handleAttachFilesClick}
        >
          <Icon type="add" className="mr-2 text-neutral" />
          {currentTab === PopoverTabs.AttachedFiles ? 'Attach' : 'Upload'} files
        </button>
      )}
    </div>
  )
}

export default observer(AttachedFilesPopover)
