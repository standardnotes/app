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
      className={`sn-icon-button flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border text-neutral hover:bg-contrast focus:bg-contrast ${
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
