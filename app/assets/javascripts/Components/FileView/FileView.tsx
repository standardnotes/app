import { WebApplication } from '@/Application/Application'
import { ElementIds } from '@/Constants/ElementIDs'
import { KeyboardKey } from '@/Services/IOService'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { FileItem } from '@standardnotes/snjs/dist/@types'
import { observer } from 'mobx-react-lite'
import { ChangeEventHandler, KeyboardEventHandler, useCallback, useEffect, useState } from 'react'
import AttachedFilesButton from '@/Components/AttachedFilesPopover/AttachedFilesButton'
import FileOptionsPanel from '@/Components/FileContextMenu/FileOptionsPanel'
import FilePreview from '@/Components/FilePreview/FilePreview'
import ProtectedItemOverlay from '@/Components/ProtectedItemOverlay/ProtectedItemOverlay'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
  file: FileItem
}

const FileView = observer(({ application, viewControllerManager, file }: Props) => {
  const onTitleChange: ChangeEventHandler<HTMLInputElement> = useCallback(async () => {
    /** @TODO */
  }, [])

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
                <AttachedFilesButton application={application} viewControllerManager={viewControllerManager} />
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
})

const FileViewWithProtectedOverlay = ({ application, viewControllerManager, file }: Props) => {
  const [shouldShowProtectedOverlay, setShouldShowProtectedOverlay] = useState(
    file.protected && !application.hasProtectionSources(),
  )

  useEffect(() => {
    setShouldShowProtectedOverlay(viewControllerManager.filesController.showProtectedOverlay)
  }, [viewControllerManager.filesController.showProtectedOverlay])

  const dismissProtectedWarning = useCallback(() => {
    void viewControllerManager.filesController.toggleFileProtection(file)
  }, [file, viewControllerManager.filesController])

  return shouldShowProtectedOverlay ? (
    <div aria-label="Note" className="section editor sn-component">
      {shouldShowProtectedOverlay && (
        <div className="h-full flex justify-center items-center">
          <ProtectedItemOverlay
            viewControllerManager={viewControllerManager}
            hasProtectionSources={application.hasProtectionSources()}
            onViewItem={dismissProtectedWarning}
            itemType={'note'}
          />
        </div>
      )}
    </div>
  ) : (
    <FileView application={application} viewControllerManager={viewControllerManager} file={file} />
  )
}

export default observer(FileViewWithProtectedOverlay)
