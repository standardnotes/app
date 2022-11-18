import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ChangeEditorMenu from './ChangeEditorMenu'
import Popover from '../Popover/Popover'
import RoundIconButton from '../Button/RoundIconButton'
import { getIconAndTintForNoteType } from '@/Utils/Items/Icons/getIconAndTintForNoteType'
import { CHANGE_EDITOR_COMMAND, keyboardStringForShortcut } from '@standardnotes/ui-services'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
  onClickPreprocessing?: () => Promise<void>
}

const ChangeEditorButton: FunctionComponent<Props> = ({
  application,
  viewControllerManager,
  onClickPreprocessing,
}: Props) => {
  const note = viewControllerManager.notesController.firstSelectedNote
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedEditor, setSelectedEditor] = useState(() => {
    return note ? application.componentManager.editorForNote(note) : undefined
  })
  const [selectedEditorIcon, selectedEditorIconTint] = getIconAndTintForNoteType(selectedEditor?.package_info.note_type)
  const [isClickOutsideDisabled, setIsClickOutsideDisabled] = useState(false)

  const toggleMenu = useCallback(async () => {
    const willMenuOpen = !isOpen
    if (willMenuOpen && onClickPreprocessing) {
      await onClickPreprocessing()
    }
    setIsOpen(willMenuOpen)
  }, [onClickPreprocessing, isOpen])

  const disableClickOutside = useCallback(() => {
    setIsClickOutsideDisabled(true)
  }, [])

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
          handleDisableClickoutsideRequest={disableClickOutside}
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
