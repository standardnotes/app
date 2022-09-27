import { observer } from 'mobx-react-lite'
import NotesOptions from '@/Components/NotesOptions/NotesOptions'
import { useRef } from 'react'
import { WebApplication } from '@/Application/Application'
import { NotesController } from '@/Controllers/NotesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NoteTagsController } from '@/Controllers/NoteTagsController'
import { HistoryModalController } from '@/Controllers/NoteHistory/HistoryModalController'
import Popover from '../Popover/Popover'

type Props = {
  application: WebApplication
  navigationController: NavigationController
  notesController: NotesController
  noteTagsController: NoteTagsController
  historyModalController: HistoryModalController
}

const NotesContextMenu = ({
  application,
  navigationController,
  notesController,
  noteTagsController,
  historyModalController,
}: Props) => {
  const { contextMenuOpen, contextMenuClickLocation, setContextMenuOpen } = notesController

  const contextMenuRef = useRef<HTMLDivElement>(null)

  const closeMenu = () => setContextMenuOpen(!contextMenuOpen)

  return (
    <Popover
      align="start"
      anchorPoint={{
        x: contextMenuClickLocation.x,
        y: contextMenuClickLocation.y,
      }}
      className="py-2"
      open={contextMenuOpen}
      side="right"
      togglePopover={closeMenu}
    >
      <div className="select-none" ref={contextMenuRef}>
        <NotesOptions
          application={application}
          navigationController={navigationController}
          notesController={notesController}
          noteTagsController={noteTagsController}
          historyModalController={historyModalController}
          closeMenu={closeMenu}
        />
      </div>
    </Popover>
  )
}

export default observer(NotesContextMenu)
