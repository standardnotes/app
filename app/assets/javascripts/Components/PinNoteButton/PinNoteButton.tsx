import { ViewControllerManager } from '@/Services/ViewControllerManager'
import VisuallyHidden from '@reach/visually-hidden'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback } from 'react'
import Icon from '@/Components/Icon/Icon'

type Props = {
  viewControllerManager: ViewControllerManager
  className?: string
  onClickPreprocessing?: () => Promise<void>
}

const PinNoteButton: FunctionComponent<Props> = ({
  viewControllerManager,
  className = '',
  onClickPreprocessing,
}: Props) => {
  const notes = viewControllerManager.notesController.selectedNotes
  const pinned = notes.some((note) => note.pinned)

  const togglePinned = useCallback(async () => {
    if (onClickPreprocessing) {
      await onClickPreprocessing()
    }
    if (!pinned) {
      viewControllerManager.notesController.setPinSelectedNotes(true)
    } else {
      viewControllerManager.notesController.setPinSelectedNotes(false)
    }
  }, [viewControllerManager, onClickPreprocessing, pinned])

  return (
    <button className={`sn-icon-button border-contrast ${pinned ? 'toggled' : ''} ${className}`} onClick={togglePinned}>
      <VisuallyHidden>Pin selected notes</VisuallyHidden>
      <Icon type="pin" className="block" />
    </button>
  )
}

export default observer(PinNoteButton)
