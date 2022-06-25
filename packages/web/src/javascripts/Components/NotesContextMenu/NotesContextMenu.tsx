import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { useCloseOnClickOutside } from '@/Hooks/useCloseOnClickOutside'
import { observer } from 'mobx-react-lite'
import NotesOptions from '@/Components/NotesOptions/NotesOptions'
import { useCallback, useEffect, useRef } from 'react'
import { WebApplication } from '@/Application/Application'
import { NotesController } from '@/Controllers/NotesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NoteTagsController } from '@/Controllers/NoteTagsController'
import { HistoryModalController } from '@/Controllers/NoteHistory/HistoryModalController'

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
  const { contextMenuOpen, contextMenuPosition, contextMenuMaxHeight } = notesController

  const contextMenuRef = useRef<HTMLDivElement>(null)
  const [closeOnBlur] = useCloseOnBlur(contextMenuRef, (open: boolean) => notesController.setContextMenuOpen(open))

  useCloseOnClickOutside(contextMenuRef, () => notesController.setContextMenuOpen(false))

  const reloadContextMenuLayout = useCallback(() => {
    notesController.reloadContextMenuLayout()
  }, [notesController])

  useEffect(() => {
    window.addEventListener('resize', reloadContextMenuLayout)
    return () => {
      window.removeEventListener('resize', reloadContextMenuLayout)
    }
  }, [reloadContextMenuLayout])

  return contextMenuOpen ? (
    <div
      ref={contextMenuRef}
      className="bg-default rounded shadow-menu min-w-80 max-h-120 max-w-xs flex flex-col pt-2 overflow-y-auto fixed z-dropdown-menu"
      style={{
        ...contextMenuPosition,
        maxHeight: contextMenuMaxHeight,
      }}
    >
      <NotesOptions
        application={application}
        closeOnBlur={closeOnBlur}
        navigationController={navigationController}
        notesController={notesController}
        noteTagsController={noteTagsController}
        historyModalController={historyModalController}
      />
    </div>
  ) : null
}

export default observer(NotesContextMenu)
