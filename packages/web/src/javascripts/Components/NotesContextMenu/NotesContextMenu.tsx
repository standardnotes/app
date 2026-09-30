import { observer } from 'mobx-react-lite'
import NotesOptions from '@/Components/NotesOptions/NotesOptions'
import { useCallback, useState } from 'react'
import Popover from '../Popover/Popover'
import Menu from '../Menu/Menu'
import { useApplication } from '../ApplicationProvider'
import { c } from 'ttag'

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
      title={c('B3.Notes.NoteActions.Label').t`Note options`}
      align="start"
      anchorPoint={{
        x: contextMenuClickLocation.x,
        y: contextMenuClickLocation.y,
      }}
      disableClickOutside={disableClickOutside}
      open={contextMenuOpen}
      togglePopover={closeMenu}
    >
      <Menu className="select-none" a11yLabel={c('B3.Notes.NoteActions.Label').t`Note context menu`}>
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
