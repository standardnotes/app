import VisuallyHidden from '@reach/visually-hidden'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback } from 'react'
import Icon from '@/Components/Icon/Icon'
import { NotesController } from '@/Controllers/NotesController'

type Props = {
  className?: string
  notesController: NotesController
  onClickPreprocessing?: () => Promise<void>
}

const PinNoteButton: FunctionComponent<Props> = ({ className = '', notesController, onClickPreprocessing }: Props) => {
  const notes = notesController.selectedNotes
  const pinned = notes.some((note) => note.pinned)

  const togglePinned = useCallback(async () => {
    if (onClickPreprocessing) {
      await onClickPreprocessing()
    }
    if (!pinned) {
      notesController.setPinSelectedNotes(true)
    } else {
      notesController.setPinSelectedNotes(false)
    }
  }, [onClickPreprocessing, pinned, notesController])

  return (
    <button
      className={`sn-icon-button flex justify-center items-center min-w-8 h-8 hover:bg-contrast focus:bg-contrast text-neutral border border-solid border-border rounded-full cursor-pointer ${
        pinned ? 'toggled' : ''
      } ${className}`}
      onClick={togglePinned}
    >
      <VisuallyHidden>Pin selected notes</VisuallyHidden>
      <Icon type="pin" className="block" />
    </button>
  )
}

export default observer(PinNoteButton)
