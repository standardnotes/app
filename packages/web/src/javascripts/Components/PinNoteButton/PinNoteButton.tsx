import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useMemo } from 'react'
import Icon from '@/Components/Icon/Icon'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import { classNames } from '@standardnotes/utils'
import { keyboardStringForShortcut, PIN_NOTE_COMMAND } from '@standardnotes/ui-services'
import { useCommandService } from '../CommandProvider'
import { VisuallyHidden } from '@ariakit/react'

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
    notesController.togglePinSelectedNotes()
  }, [onClickPreprocessing, notesController])

  const commandService = useCommandService()

  const shortcut = useMemo(
    () => keyboardStringForShortcut(commandService.keyboardShortcutForCommand(PIN_NOTE_COMMAND)),
    [commandService],
  )

  const label = pinned ? `Unpin note (${shortcut})` : `Pin note (${shortcut})`

  return (
    <button
      className={classNames(
        'sn-icon-button flex h-10 min-w-10 cursor-pointer items-center justify-center',
        'focus:bg-contras rounded-full border border-solid border-border text-neutral hover:bg-contrast',
        `md:h-8 md:min-w-8 ${pinned ? 'toggled' : ''}`,
        className,
      )}
      onClick={togglePinned}
      title={label}
      aria-label={label}
    >
      <VisuallyHidden>Pin selected notes</VisuallyHidden>
      <Icon type="pin" className="block" />
    </button>
  )
}

export default observer(PinNoteButton)
