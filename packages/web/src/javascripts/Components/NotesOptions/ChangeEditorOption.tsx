import { CHANGE_EDITOR_COMMAND, KeyboardKey } from '@standardnotes/ui-services'
import { WebApplication } from '@/Application/WebApplication'
import { SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useMemo, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import ChangeEditorMenu from '@/Components/ChangeEditor/ChangeEditorMenu'
import Popover from '../Popover/Popover'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import MenuItem from '../Menu/MenuItem'

type ChangeEditorOptionProps = {
  application: WebApplication
  note: SNNote
  iconClassName: string
  disabled?: boolean
}

const ChangeEditorOption: FunctionComponent<ChangeEditorOptionProps> = ({
  application,
  note,
  iconClassName,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleMenu = useCallback(async () => {
    setIsOpen((isOpen) => !isOpen)
  }, [])

  const shortcut = useMemo(
    () => application.keyboardService.keyboardShortcutForCommand(CHANGE_EDITOR_COMMAND),
    [application],
  )

  return (
    <div ref={menuContainerRef}>
      <MenuItem
        className="justify-between"
        onClick={toggleMenu}
        onKeyDown={(event) => {
          if (event.key === KeyboardKey.Escape) {
            setIsOpen(false)
          }
        }}
        disabled={disabled}
        ref={buttonRef}
      >
        <div className="flex items-center">
          <Icon type="dashboard" className={`${iconClassName} mr-2 text-neutral`} />
          Change note type
        </div>
        <div className="flex">
          {shortcut && <KeyboardShortcutIndicator className={'mr-2'} shortcut={shortcut} />}
          <Icon type="chevron-right" className="text-neutral" />
        </div>
      </MenuItem>
      <Popover
        title="Change note type"
        align="start"
        anchorElement={buttonRef}
        className="md:pb-1"
        open={isOpen}
        side="right"
        togglePopover={toggleMenu}
      >
        <ChangeEditorMenu
          application={application}
          note={note}
          closeMenu={() => {
            setIsOpen(false)
          }}
        />
      </Popover>
    </div>
  )
}

export default ChangeEditorOption
