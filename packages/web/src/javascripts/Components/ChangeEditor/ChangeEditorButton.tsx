import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ChangeEditorMenu from './ChangeEditorMenu'
import Popover from '../Popover/Popover'
import RoundIconButton from '../Button/RoundIconButton'
import { getIconAndTintForNoteType } from '@/Utils/Items/Icons/getIconAndTintForNoteType'
import { CHANGE_EDITOR_COMMAND, keyboardStringForShortcut } from '@standardnotes/ui-services'
import { useApplication } from '../ApplicationProvider'
import { NoteViewController } from '../NoteView/Controller/NoteViewController'
import { NoteType, noteTypeForEditorIdentifier } from '@standardnotes/snjs'

type Props = {
  noteViewController?: NoteViewController
  onClickPreprocessing?: () => Promise<void>
}

const ChangeEditorButton: FunctionComponent<Props> = ({ noteViewController, onClickPreprocessing }: Props) => {
  const application = useApplication()

  const note = application.notesController.firstSelectedNote
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedEditor, setSelectedEditor] = useState(() => {
    return note ? application.componentManager.editorForNote(note) : undefined
  })

  const noteType = noteViewController?.isTemplateNote
    ? noteTypeForEditorIdentifier(
        application.componentManager.getDefaultEditorIdentifier(
          noteViewController.templateNoteOptions?.tag
            ? application.items.findItem(noteViewController.templateNoteOptions.tag)
            : undefined,
        ),
      )
    : note && note.noteType != NoteType.Unknown
    ? note.noteType
    : selectedEditor
    ? selectedEditor.noteType
    : NoteType.Unknown

  const [selectedEditorIcon, selectedEditorIconTint] = getIconAndTintForNoteType(noteType, true)
  const [isClickOutsideDisabled, setIsClickOutsideDisabled] = useState(false)

  const toggleMenu = useCallback(async () => {
    const willMenuOpen = !isOpen
    if (willMenuOpen && onClickPreprocessing) {
      await onClickPreprocessing()
    }
    setIsOpen(willMenuOpen)
  }, [onClickPreprocessing, isOpen])

  useEffect(() => {
    return application.keyboardService.addCommandHandler({
      command: CHANGE_EDITOR_COMMAND,
      onKeyDown: () => {
        void toggleMenu()
      },
    })
  }, [application, toggleMenu])

  const shortcut = useMemo(
    () => application.keyboardService.keyboardShortcutForCommand(CHANGE_EDITOR_COMMAND),
    [application],
  )

  return (
    <div ref={containerRef}>
      <RoundIconButton
        label={`Change note type (${shortcut && keyboardStringForShortcut(shortcut)})`}
        onClick={toggleMenu}
        ref={buttonRef}
        icon={selectedEditorIcon}
        iconClassName={`text-accessory-tint-${selectedEditorIconTint}`}
      />
      <Popover
        title="Change note type"
        togglePopover={toggleMenu}
        disableClickOutside={isClickOutsideDisabled}
        anchorElement={buttonRef.current}
        open={isOpen}
        className="pt-2 md:pt-0"
      >
        <ChangeEditorMenu
          application={application}
          isVisible={isOpen}
          note={note}
          setDisableClickOutside={setIsClickOutsideDisabled}
          closeMenu={() => {
            setIsOpen(false)
          }}
          onSelect={(component) => {
            setSelectedEditor(component)
          }}
        />
      </Popover>
    </div>
  )
}

export default observer(ChangeEditorButton)
