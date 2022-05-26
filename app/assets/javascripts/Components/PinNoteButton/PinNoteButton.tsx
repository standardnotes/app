import { AppState } from '@/UIModels/AppState'
import VisuallyHidden from '@reach/visually-hidden'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback } from 'react'
import Icon from '@/Components/Icon/Icon'

type Props = {
  appState: AppState
  className?: string
  onClickPreprocessing?: () => Promise<void>
}

const PinNoteButton: FunctionComponent<Props> = ({ appState, className = '', onClickPreprocessing }: Props) => {
  const notes = appState.notes.selectedNotes
  const pinned = notes.some((note) => note.pinned)

  const togglePinned = useCallback(async () => {
    if (onClickPreprocessing) {
      await onClickPreprocessing()
    }
    if (!pinned) {
      appState.notes.setPinSelectedNotes(true)
    } else {
      appState.notes.setPinSelectedNotes(false)
    }
  }, [appState, onClickPreprocessing, pinned])

  return (
    <button className={`sn-icon-button border-contrast ${pinned ? 'toggled' : ''} ${className}`} onClick={togglePinned}>
      <VisuallyHidden>Pin selected notes</VisuallyHidden>
      <Icon type="pin" className="block" />
    </button>
  )
}

export default observer(PinNoteButton)
