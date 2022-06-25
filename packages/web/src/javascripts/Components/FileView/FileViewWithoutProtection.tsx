import { ElementIds } from '@/Constants/ElementIDs'
import { observer } from 'mobx-react-lite'
import { ChangeEventHandler, FormEventHandler, useCallback, useEffect, useState } from 'react'
import AttachedFilesButton from '@/Components/AttachedFilesPopover/AttachedFilesButton'
import FileOptionsPanel from '@/Components/FileContextMenu/FileOptionsPanel'
import FilePreview from '@/Components/FilePreview/FilePreview'
import { FileViewProps } from './FileViewProps'

const FileViewWithoutProtection = ({ application, viewControllerManager, file }: FileViewProps) => {
  const [name, setName] = useState(file.name)

  useEffect(() => {
    setName(file.name)
  }, [file.name])

  const onTitleChange: ChangeEventHandler<HTMLInputElement> = useCallback(async (event) => {
    setName(event.target.value)
  }, [])

  const onFormSubmit: FormEventHandler = useCallback(
    async (event) => {
      event.preventDefault()

      await application.items.renameFile(file, name)

      void application.sync.sync()
    },
    [application.items, application.sync, file, name],
  )

  return (
    <div className="sn-component section editor" aria-label="File">
      <div className="flex flex-col">
        <div className="content-title-bar z-editor-title-bar section-title-bar w-full" id="file-title-bar">
          <div className="flex items-center justify-between h-8">
            <div className="flex-grow">
              <form onSubmit={onFormSubmit} className="title overflow-auto">
                <input
                  className="input text-lg"
                  id={ElementIds.FileTitleEditor}
                  onChange={onTitleChange}
                  onFocus={(event) => {
                    event.target.select()
                  }}
                  spellCheck={false}
                  value={name}
                  autoComplete="off"
                />
              </form>
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
                  selectionController={viewControllerManager.selectionController}
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

export default observer(FileViewWithoutProtection)
