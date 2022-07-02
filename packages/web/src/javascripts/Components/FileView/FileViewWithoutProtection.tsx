import { ElementIds } from '@/Constants/ElementIDs'
import { observer } from 'mobx-react-lite'
import { ChangeEventHandler, useCallback, useRef } from 'react'
import FileOptionsPanel from '@/Components/FileContextMenu/FileOptionsPanel'
import FilePreview from '@/Components/FilePreview/FilePreview'
import { FileViewProps } from './FileViewProps'

const SyncTimeoutNoDebounceMs = 100
const SyncTimeoutDebounceMs = 350

const FileViewWithoutProtection = ({ application, viewControllerManager, file }: FileViewProps) => {
  const syncTimeoutRef = useRef<number>()

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

  return (
    <div className="sn-component section editor" aria-label="File">
      <div className="flex flex-col">
        <div
          className="content-title-bar section-title-bar section-title-bar z-editor-title-bar w-full"
          id="file-title-bar"
        >
          <div className="flex h-8 items-center justify-between">
            <div className="flex-grow">
              <div className="title overflow-auto">
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
            <div className="flex items-center">
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

export default observer(FileViewWithoutProtection)
