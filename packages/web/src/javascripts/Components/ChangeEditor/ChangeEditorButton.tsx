import { observer } from 'mobx-react-lite'
import { c } from 'ttag'
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
  onClick?: () => void
  onClickPreprocessing?: () => Promise<void>
}

const ChangeEditorButton: FunctionComponent<Props> = ({ noteViewController, onClick, onClickPreprocessing }: Props) => {
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
    if (onClick) {
      onClick()
    }
  }, [isOpen, onClickPreprocessing, onClick])

  useEffect(() => {
    return application.commands.addWithShortcut(
      CHANGE_EDITOR_COMMAND,
      'Current note',
      c('B4.Notes.EditingUI.Action').t`Change note type`,
      () => {
        void toggleMenu()
      },
      'notes',
    )
  }, [application, toggleMenu])

  const shortcut = useMemo(
    () => application.keyboardService.keyboardShortcutForCommand(CHANGE_EDITOR_COMMAND),
    [application],
  )

  const shortcutLabel = shortcut && keyboardStringForShortcut(shortcut)

  return (
    <div ref={containerRef}>
      <RoundIconButton
        label={c('B4.Notes.EditingUI.Label').jt`Change note type (${shortcutLabel})` as unknown as string}
        onClick={toggleMenu}
        ref={buttonRef}
        icon={selectedEditorIcon}
        iconClassName={`text-accessory-tint-${selectedEditorIconTint}`}
      />
      <Popover
        title={c('B4.Notes.EditingUI.Title').t`Change note type`}
        togglePopover={toggleMenu}
        disableClickOutside={isClickOutsideDisabled}
        anchorElement={buttonRef}
        open={isOpen}
        className="md:pb-1"
      >
        <ChangeEditorMenu
          application={application}
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
