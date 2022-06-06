import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { useCloseOnClickOutside } from '@/Hooks/useCloseOnClickOutside'
import { observer } from 'mobx-react-lite'
import NotesOptions from '@/Components/NotesOptions/NotesOptions'
import { useCallback, useEffect, useRef } from 'react'
import { WebApplication } from '@/Application/Application'
import { NotesController } from '@/Controllers/NotesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NoteTagsController } from '@/Controllers/NoteTagsController'

type Props = {
  application: WebApplication
  navigationController: NavigationController
  notesController: NotesController
  noteTagsController: NoteTagsController
}

const NotesContextMenu = ({ application, navigationController, notesController, noteTagsController }: Props) => {
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
      className="sn-dropdown min-w-80 max-h-120 max-w-xs flex flex-col pt-2 overflow-y-auto fixed"
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
      />
    </div>
  ) : null
}

export default observer(NotesContextMenu)
