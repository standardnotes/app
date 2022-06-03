import { ElementIds } from '@/Constants/ElementIDs'
import { KeyboardKey } from '@/Services/IOService'
import { observer } from 'mobx-react-lite'
import { ChangeEventHandler, KeyboardEventHandler, useCallback, useRef } from 'react'
import AttachedFilesButton from '@/Components/AttachedFilesPopover/AttachedFilesButton'
import FileOptionsPanel from '@/Components/FileContextMenu/FileOptionsPanel'
import FilePreview from '@/Components/FilePreview/FilePreview'
import { FileViewProps } from './FileViewProps'
import { SYNC_TIMEOUT_DEBOUNCE, SYNC_TIMEOUT_NO_DEBOUNCE } from '@/Constants/Constants'

const FileView = ({ application, viewControllerManager, file }: FileViewProps) => {
  const syncTimeoutRef = useRef<number>()

  const onTitleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    async (event) => {
      void application.items.renameFile(file, event.target.value)

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }

      const debounceTime = application.noAccount() ? SYNC_TIMEOUT_NO_DEBOUNCE : SYNC_TIMEOUT_DEBOUNCE

      syncTimeoutRef.current = window.setTimeout(() => {
        void application.sync.sync()
      }, debounceTime)
    },
    [application, file],
  )

  const onTitleEnter: KeyboardEventHandler<HTMLInputElement> = useCallback(({ key, currentTarget }) => {
    if (key !== KeyboardKey.Enter) {
      return
    }

    currentTarget.blur()
  }, [])

  return (
    <div className="sn-component section editor" aria-label="File">
      <div className="flex flex-col">
        <div className="content-title-bar section-title-bar w-full" id="file-title-bar">
          <div className="flex items-center justify-between h-8">
            <div className="flex-grow">
              <div className="title overflow-auto">
                <input
                  className="input"
                  id={ElementIds.FileTitleEditor}
                  onChange={onTitleChange}
                  onFocus={(event) => {
                    event.target.select()
                  }}
                  onKeyUp={onTitleEnter}
                  spellCheck={false}
                  value={file.name}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="flex items-center">
              <div className="mr-3">
                <AttachedFilesButton
                  application={application}
                  featuresController={viewControllerManager.featuresController}
                  filePreviewModalController={viewControllerManager.filePreviewModalController}
                  filesController={viewControllerManager.filesController}
                  navigationController={viewControllerManager.navigationController}
                  notesController={viewControllerManager.notesController}
                />
              </div>
              <FileOptionsPanel
                filesController={viewControllerManager.filesController}
                selectionController={viewControllerManager.selectionController}
              />
            </div>
          </div>
        </div>
      </div>
      <FilePreview file={file} application={application} key={file.uuid} />
    </div>
  )
}

export default observer(FileView)
