import { observer } from 'mobx-react-lite'
import NotesOptions from '@/Components/NotesOptions/NotesOptions'
import { useCallback, useRef, useState } from 'react'
import { WebApplication } from '@/Application/Application'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { HistoryModalController } from '@/Controllers/NoteHistory/HistoryModalController'
import Popover from '../Popover/Popover'
import { LinkingController } from '@/Controllers/LinkingController'

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

  const contextMenuRef = useRef<HTMLDivElement>(null)

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
      <div className="select-none" ref={contextMenuRef}>
        <NotesOptions
          application={application}
          navigationController={navigationController}
          notesController={notesController}
          linkingController={linkingController}
          historyModalController={historyModalController}
          requestDisableClickOutside={handleDisableClickOutsideRequest}
          closeMenu={closeMenu}
        />
      </div>
    </Popover>
  )
}

export default observer(NotesContextMenu)
