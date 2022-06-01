import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { useCloseOnClickOutside } from '@/Hooks/useCloseOnClickOutside'
import { observer } from 'mobx-react-lite'
import NotesOptions from '@/Components/NotesOptions/NotesOptions'
import { useCallback, useEffect, useRef } from 'react'
import { WebApplication } from '@/Application/Application'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
}

const NotesContextMenu = ({ application, viewControllerManager }: Props) => {
  const { contextMenuOpen, contextMenuPosition, contextMenuMaxHeight } = viewControllerManager.notesController

  const contextMenuRef = useRef<HTMLDivElement>(null)
  const [closeOnBlur] = useCloseOnBlur(contextMenuRef, (open: boolean) =>
    viewControllerManager.notesController.setContextMenuOpen(open),
  )

  useCloseOnClickOutside(contextMenuRef, () => viewControllerManager.notesController.setContextMenuOpen(false))

  const reloadContextMenuLayout = useCallback(() => {
    viewControllerManager.notesController.reloadContextMenuLayout()
  }, [viewControllerManager])

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
      <NotesOptions application={application} viewControllerManager={viewControllerManager} closeOnBlur={closeOnBlur} />
    </div>
  ) : null
}

export default observer(NotesContextMenu)
