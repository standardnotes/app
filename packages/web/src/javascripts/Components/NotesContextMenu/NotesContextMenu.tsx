import { observer } from 'mobx-react-lite'
import NotesOptions from '@/Components/NotesOptions/NotesOptions'
import { useCallback, useState } from 'react'
import Popover from '../Popover/Popover'
import Menu from '../Menu/Menu'
import { useApplication } from '../ApplicationProvider'

const NotesContextMenu = () => {
  const application = useApplication()

  const { contextMenuOpen, contextMenuClickLocation, setContextMenuOpen } = application.notesController

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
      open={contextMenuOpen}
      togglePopover={closeMenu}
    >
      <Menu className="select-none" a11yLabel="Note context menu">
        <NotesOptions
          notes={application.notesController.selectedNotes}
          requestDisableClickOutside={handleDisableClickOutsideRequest}
          closeMenu={closeMenu}
        />
      </Menu>
    </Popover>
  )
}

export default observer(NotesContextMenu)
