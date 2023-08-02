import { observer } from 'mobx-react-lite'
import NotesOptions from '@/Components/NotesOptions/NotesOptions'
import { useCallback, useState } from 'react'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { HistoryModalController } from '@/Controllers/NoteHistory/HistoryModalController'
import Popover from '../Popover/Popover'
import { LinkingController } from '@/Controllers/LinkingController'
import Menu from '../Menu/Menu'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'

type Props = {
  navigationController: NavigationController
  notesController: NotesController
  linkingController: LinkingController
  historyModalController: HistoryModalController
  selectionController: SelectedItemsController
}

const NotesContextMenu = ({
  navigationController,
  notesController,
  linkingController,
  historyModalController,
  selectionController,
}: Props) => {
  const { contextMenuOpen, contextMenuClickLocation, setContextMenuOpen } = notesController

  const closeMenu = () => setContextMenuOpen(!contextMenuOpen)

  const [disableClickOutside, setDisableClickOutside] = useState(false)
  const handleDisableClickOutsideRequest = useCallback((disabled: boolean) => {
    setDisableClickOutside(disabled)
  }, [])

  return (
    <Popover
      title="Note options"
      align="start"
      anchorPoint={{
        x: contextMenuClickLocation.x,
        y: contextMenuClickLocation.y,
      }}
      disableClickOutside={disableClickOutside}
      className="py-2"
      open={contextMenuOpen}
      togglePopover={closeMenu}
    >
      <Menu className="select-none" a11yLabel="Note context menu" isOpen={contextMenuOpen}>
        <NotesOptions
          notes={notesController.selectedNotes}
          navigationController={navigationController}
          notesController={notesController}
          linkingController={linkingController}
          historyModalController={historyModalController}
          selectionController={selectionController}
          requestDisableClickOutside={handleDisableClickOutsideRequest}
          closeMenu={closeMenu}
        />
      </Menu>
    </Popover>
  )
}

export default observer(NotesContextMenu)
