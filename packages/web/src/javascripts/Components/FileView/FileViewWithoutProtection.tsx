import { ElementIds } from '@/Constants/ElementIDs'
import { observer } from 'mobx-react-lite'
import { ChangeEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import FileOptionsPanel from '@/Components/FileContextMenu/FileOptionsPanel'
import FilePreview from '@/Components/FilePreview/FilePreview'
import { FileViewProps } from './FileViewProps'
import MobileItemsListButton from '../NoteGroupView/MobileItemsListButton'
import LinkedItemsButton from '../LinkedItems/LinkedItemsButton'
import LinkedItemBubblesContainer from '../LinkedItems/LinkedItemBubblesContainer'
import Icon from '../Icon/Icon'
import Popover from '../Popover/Popover'
import FilePreviewInfoPanel from '../FilePreview/FilePreviewInfoPanel'
import { useFileDragNDrop } from '../FileDragNDropProvider/FileDragNDropProvider'

const SyncTimeoutNoDebounceMs = 100
const SyncTimeoutDebounceMs = 350

const FileViewWithoutProtection = ({ application, viewControllerManager, file }: FileViewProps) => {
  const syncTimeoutRef = useRef<number>()
  const fileInfoButtonRef = useRef<HTMLButtonElement>(null)

  const [isFileInfoPanelOpen, setIsFileInfoPanelOpen] = useState(false)
  const toggleFileInfoPanel = () => {
    setIsFileInfoPanelOpen((show) => !show)
  }

  const onTitleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    async (event) => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }

      const shouldNotDebounce = application.noAccount()
      const syncDebounceMs = shouldNotDebounce ? SyncTimeoutNoDebounceMs : SyncTimeoutDebounceMs

      syncTimeoutRef.current = window.setTimeout(async () => {
        await application.items.renameFile(file, event.target.value)
        void application.sync.sync()
      }, syncDebounceMs)
    },
    [application, file],
  )

  const fileDragTargetRef = useRef<HTMLDivElement>(null)

  const { addDragTarget, removeDragTarget } = useFileDragNDrop()

  useEffect(() => {
    const target = fileDragTargetRef.current

    if (target) {
      addDragTarget(target, {
        tooltipText: 'Drop your files to upload and link them to the current file',
        callback(files) {
          files.forEach(async (uploadedFile) => {
            await viewControllerManager.linkingController.linkItems(uploadedFile, file)
          })
        },
      })
    }

    return () => {
      if (target) {
        removeDragTarget(target)
      }
    }
  }, [addDragTarget, file, removeDragTarget, viewControllerManager.linkingController])

  return (
    <div className="sn-component section editor" aria-label="File" ref={fileDragTargetRef}>
      <div className="flex flex-col">
        <div
          className="content-title-bar section-title-bar section-title-bar z-editor-title-bar w-full"
          id="file-title-bar"
        >
          <div className="flex h-8 items-center justify-between">
            <div className="flex flex-grow items-center">
              <MobileItemsListButton />
              <div className="title flex-grow overflow-auto">
                <input
                  className="input text-lg"
                  id={ElementIds.FileTitleEditor}
                  onChange={onTitleChange}
                  onFocus={(event) => {
                    event.target.select()
                  }}
                  spellCheck={false}
                  defaultValue={file.name}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LinkedItemsButton
                filesController={viewControllerManager.filesController}
                linkingController={viewControllerManager.linkingController}
              />
              <button
                className="bg-text-padding flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border text-neutral hover:bg-contrast focus:bg-contrast"
                title="File information panel"
                aria-label="File information panel"
                onClick={toggleFileInfoPanel}
                ref={fileInfoButtonRef}
              >
                <Icon type="info" />
              </button>
              <Popover
                open={isFileInfoPanelOpen}
                togglePopover={toggleFileInfoPanel}
                anchorElement={fileInfoButtonRef.current}
                side="bottom"
                align="center"
              >
                <FilePreviewInfoPanel file={file} />
              </Popover>
              <FileOptionsPanel
                filesController={viewControllerManager.filesController}
                selectionController={viewControllerManager.selectionController}
              />
            </div>
          </div>
          <LinkedItemBubblesContainer linkingController={viewControllerManager.linkingController} />
        </div>
      </div>
      <div className="flex min-h-0 flex-grow flex-col">
        <FilePreview file={file} application={application} key={file.uuid} />
      </div>
    </div>
  )
}

export default observer(FileViewWithoutProtection)
