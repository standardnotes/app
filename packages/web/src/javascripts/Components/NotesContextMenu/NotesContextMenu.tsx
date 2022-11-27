import { observer } from 'mobx-react-lite'
import NotesOptions from '@/Components/NotesOptions/NotesOptions'
import { useCallback, useState } from 'react'
import { WebApplication } from '@/Application/Application'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { HistoryModalController } from '@/Controllers/NoteHistory/HistoryModalController'
import Popover from '../Popover/Popover'
import { LinkingController } from '@/Controllers/LinkingController'
import Menu from '../Menu/Menu'

type Props = {
  application: WebApplication
  navigationController: NavigationController
  notesController: NotesController
  linkingController: LinkingController
  historyModalController: HistoryModalController
}

const NotesContextMenu = ({
  application,
  navigationController,
  notesController,
  linkingController,
  historyModalController,
}: Props) => {
  const { contextMenuOpen, contextMenuClickLocation, setContextMenuOpen } = notesController

  const closeMenu = () => setContextMenuOpen(!contextMenuOpen)

  const [disableClickOutside, setDisableClickOutside] = useState(false)
  const handleDisableClickOutsideRequest = useCallback((disabled: boolean) => {
    setDisableClickOutside(disabled)
  }, [])

  return (
    <Popover
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
          application={application}
          navigationController={navigationController}
          notesController={notesController}
          linkingController={linkingController}
          historyModalController={historyModalController}
          requestDisableClickOutside={handleDisableClickOutsideRequest}
          closeMenu={closeMenu}
        />
      </Menu>
    </Popover>
  )
}

export default observer(NotesContextMenu)
