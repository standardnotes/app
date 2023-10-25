import { FilesController } from '@/Controllers/FilesController'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import Menu from '../Menu/Menu'
import Popover from '../Popover/Popover'
import FileMenuOptions from './FileMenuOptions'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'

type Props = {
  filesController: FilesController
  itemListController: ItemListController
}

const FileContextMenu: FunctionComponent<Props> = observer(({ filesController, itemListController }) => {
  const { showFileContextMenu, setShowFileContextMenu, fileContextMenuLocation } = filesController
  const { selectedFiles } = itemListController

  return (
    <Popover
      title="File options"
      open={showFileContextMenu}
      anchorPoint={fileContextMenuLocation}
      togglePopover={() => setShowFileContextMenu(!showFileContextMenu)}
      align="start"
      className="md:pb-2"
    >
      <Menu a11yLabel="File context menu">
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

const FileContextMenuWrapper: FunctionComponent<Props> = ({ filesController, itemListController }) => {
  const { showFileContextMenu } = filesController
  const { selectedFiles } = itemListController

  const selectedFile = selectedFiles[0]

  if (!showFileContextMenu || !selectedFile) {
    return null
  }

  return <FileContextMenu filesController={filesController} itemListController={itemListController} />
}

export default observer(FileContextMenuWrapper)
