import { AppState } from '@/UIModels/AppState'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { useCloseOnClickOutside } from '@/Hooks/useCloseOnClickOutside'
import { observer } from 'mobx-react-lite'
import { NotesOptions } from '@/Components/NotesOptions/NotesOptions'
import { useCallback, useEffect, useRef } from 'preact/hooks'
import { WebApplication } from '@/UIModels/Application'

type Props = {
  application: WebApplication
  appState: AppState
}

export const NotesContextMenu = observer(({ application, appState }: Props) => {
  const { contextMenuOpen, contextMenuPosition, contextMenuMaxHeight } = appState.notes

  const contextMenuRef = useRef<HTMLDivElement>(null)
  const [closeOnBlur] = useCloseOnBlur(contextMenuRef, (open: boolean) => appState.notes.setContextMenuOpen(open))

  useCloseOnClickOutside(contextMenuRef, () => appState.notes.setContextMenuOpen(false))

  const reloadContextMenuLayout = useCallback(() => {
    appState.notes.reloadContextMenuLayout()
  }, [appState])

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
      <NotesOptions application={application} appState={appState} closeOnBlur={closeOnBlur} />
    </div>
  ) : null
})
