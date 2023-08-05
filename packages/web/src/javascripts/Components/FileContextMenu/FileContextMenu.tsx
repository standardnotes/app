import { FilesController } from '@/Controllers/FilesController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import Menu from '../Menu/Menu'
import Popover from '../Popover/Popover'
import FileMenuOptions from './FileMenuOptions'

type Props = {
  filesController: FilesController
  selectionController: SelectedItemsController
}

const FileContextMenu: FunctionComponent<Props> = observer(({ filesController, selectionController }) => {
  const { showFileContextMenu, setShowFileContextMenu, fileContextMenuLocation } = filesController
  const { selectedFiles } = selectionController

  return (
    <Popover
      title="File options"
      open={showFileContextMenu}
      anchorPoint={fileContextMenuLocation}
      togglePopover={() => setShowFileContextMenu(!showFileContextMenu)}
      align="start"
      className="py-2"
    >
      <Menu a11yLabel="File context menu" isOpen={showFileContextMenu}>
        <FileMenuOptions
          selectedFiles={selectedFiles}
          closeMenu={() => setShowFileContextMenu(false)}
          shouldShowRenameOption={false}
          shouldShowAttachOption={false}
        />
      </Menu>
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
