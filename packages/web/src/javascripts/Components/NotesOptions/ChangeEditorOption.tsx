import { CHANGE_EDITOR_COMMAND, KeyboardKey } from '@standardnotes/ui-services'
import { WebApplication } from '@/Application/Application'
import { SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useMemo, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import ChangeEditorMenu from '@/Components/ChangeEditor/ChangeEditorMenu'
import Popover from '../Popover/Popover'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'

type ChangeEditorOptionProps = {
  application: WebApplication
  note: SNNote
  className: string
  iconClassName: string
}

const ChangeEditorOption: FunctionComponent<ChangeEditorOptionProps> = ({
  application,
  note,
  className,
  iconClassName,
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
      <button
        onClick={toggleMenu}
        onKeyDown={(event) => {
          if (event.key === KeyboardKey.Escape) {
            setIsOpen(false)
          }
        }}
        ref={buttonRef}
        className={className}
      >
        <div className="flex items-center">
          <Icon type="dashboard" className={`${iconClassName} mr-2 text-neutral`} />
          Change note type
        </div>
        <div className="flex">
          {shortcut && <KeyboardShortcutIndicator className={'mr-2'} shortcut={shortcut} />}
          <Icon type="chevron-right" className="text-neutral" />
        </div>
      </button>
      <Popover
        align="start"
        anchorElement={buttonRef.current}
        className="pt-2 md:pt-0"
        open={isOpen}
        side="right"
        togglePopover={toggleMenu}
      >
        <ChangeEditorMenu
          application={application}
          note={note}
          isVisible={isOpen}
          closeMenu={() => {
            setIsOpen(false)
          }}
        />
      </Popover>
    </div>
  )
}

export default ChangeEditorOption
