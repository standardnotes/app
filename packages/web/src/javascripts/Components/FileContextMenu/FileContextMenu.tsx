import { FilesController } from '@/Controllers/FilesController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useRef } from 'react'
import Popover from '../Popover/Popover'
import FileMenuOptions from './FileMenuOptions'

type Props = {
  filesController: FilesController
  selectionController: SelectedItemsController
}

const FileContextMenu: FunctionComponent<Props> = observer(({ filesController, selectionController }) => {
  const { showFileContextMenu, setShowFileContextMenu, fileContextMenuLocation } = filesController

  const contextMenuRef = useRef<HTMLDivElement>(null)

  return (
    <Popover
      open={showFileContextMenu}
      anchorPoint={fileContextMenuLocation}
      togglePopover={() => setShowFileContextMenu(!showFileContextMenu)}
      side="right"
      align="start"
    >
      <div ref={contextMenuRef}>
        <FileMenuOptions
          filesController={filesController}
          selectionController={selectionController}
          closeMenu={() => setShowFileContextMenu(false)}
          shouldShowRenameOption={false}
          shouldShowAttachOption={false}
        />
      </div>
    </Popover>
  )
})

FileContextMenu.displayName = 'FileContextMenu'

const FileContextMenuWrapper: FunctionComponent<Props> = ({ filesController, selectionController }) => {
  const { showFileContextMenu } = filesController
  const { selectedFiles } = selectionController

  const selectedFile = selectedFiles[0]

  if (!showFileContextMenu || !selectedFile) {
    return null
  }

  return <FileContextMenu filesController={filesController} selectionController={selectionController} />
}

export default observer(FileContextMenuWrapper)
