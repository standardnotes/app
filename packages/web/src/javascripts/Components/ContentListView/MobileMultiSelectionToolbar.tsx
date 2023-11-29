import { NotesController } from '@/Controllers/NotesController/NotesController'
import Icon from '../Icon/Icon'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { observer } from 'mobx-react-lite'
import { SystemViewId, isSmartView } from '@standardnotes/snjs'

type Props = {
  notesController: NotesController
  navigationController: NavigationController
}

const MobileMultiSelectionToolbar = ({ notesController, navigationController }: Props) => {
  const { selectedNotes } = notesController
  const { selected } = navigationController

  const archived = selectedNotes.some((note) => note.archived)

  return (
    <div className="flex w-full bg-contrast pb-safe-bottom">
      <button
        className="flex-grow px-2 py-3 active:bg-passive-3"
        onClick={() => notesController.togglePinSelectedNotes()}
      >
        <Icon type="pin" className="mx-auto text-info" size="large" />
      </button>
      <button
        className="flex-grow px-2 py-3 active:bg-passive-3"
        onClick={() => notesController.toggleArchiveSelectedNotes().catch(console.error)}
      >
        <Icon type={archived ? 'unarchive' : 'archive'} className="mx-auto text-info" size="large" />
      </button>
      <button
        className="flex-grow px-2 py-3 active:bg-passive-3"
        onClick={() => {
          const isInTrashView = selected && isSmartView(selected) && selected.uuid === SystemViewId.TrashedNotes
          const allSelectedNotesAreTrashed = selectedNotes.every((note) => note.trashed)
          const shouldDeletePermanently = isInTrashView || allSelectedNotesAreTrashed
          if (shouldDeletePermanently) {
            notesController.deleteNotesPermanently().catch(console.error)
          } else {
            notesController.setTrashSelectedNotes(true).catch(console.error)
          }
        }}
      >
        <Icon type="trash" className="mx-auto text-info" size="large" />
      </button>
      <button
        className="flex-grow px-2 py-3 active:bg-passive-3"
        onClick={() => notesController.setContextMenuOpen(true)}
      >
        <Icon type="more" className="mx-auto text-info" size="large" />
      </button>
    </div>
  )
}

export default observer(MobileMultiSelectionToolbar)
