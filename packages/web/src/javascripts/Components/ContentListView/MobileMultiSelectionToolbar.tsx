import { NotesController } from '@/Controllers/NotesController/NotesController'
import Icon from '../Icon/Icon'

type Props = {
  notesController: NotesController
}

const MobileMultiSelectionToolbar = ({ notesController }: Props) => {
  const { selectedNotes } = notesController

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
        onClick={() => notesController.setTrashSelectedNotes(true).catch(console.error)}
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

export default MobileMultiSelectionToolbar
