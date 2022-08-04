import { KeyboardKey } from '@standardnotes/ui-services'
import { WebApplication } from '@/Application/Application'
import { SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import ChangeEditorMenu from '@/Components/ChangeEditor/ChangeEditorMenu'
import Popover from '../Popover/Popover'

type ChangeEditorOptionProps = {
  application: WebApplication
  note: SNNote
}

const ChangeEditorOption: FunctionComponent<ChangeEditorOptionProps> = ({ application, note }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleMenu = useCallback(async () => {
    setIsOpen((isOpen) => !isOpen)
  }, [])

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
        className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-3 py-1.5 text-left text-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
      >
        <div className="flex items-center">
          <Icon type="dashboard" className="mr-2 text-neutral" />
          Change note type
        </div>
        <Icon type="chevron-right" className="text-neutral" />
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
