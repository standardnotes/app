import { WebApplication } from '@/Application/WebApplication'
import { SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import ListedActionsMenu from './ListedActionsMenu'
import { KeyboardKey } from '@standardnotes/ui-services'
import Popover from '../../Popover/Popover'
import MenuItem from '@/Components/Menu/MenuItem'

type Props = {
  application: WebApplication
  note: SNNote
  iconClassName: string
}

const ListedActionsOption: FunctionComponent<Props> = ({ application, note, iconClassName }) => {
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = useCallback(async () => {
    if (!application.listed.isNoteAuthorizedForListed(note)) {
      await application.listed.authorizeNoteForListed(note)
    }

    if (application.listed.isNoteAuthorizedForListed(note)) {
      setIsOpen((isOpen) => !isOpen)
    }
  }, [application, note])

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
        ref={buttonRef}
      >
        <div className="flex items-center">
          <Icon type="listed" className={`mr-2 text-neutral ${iconClassName}`} />
          Listed actions
        </div>
        <Icon type="chevron-right" className="text-neutral" />
      </MenuItem>
      <Popover
        title="Listed"
        togglePopover={toggleMenu}
        anchorElement={buttonRef}
        open={isOpen}
        side="right"
        align="end"
        className="px-4 md:px-0 md:pt-0"
      >
        <ListedActionsMenu application={application} note={note} />
      </Popover>
    </div>
  )
}

export default ListedActionsOption
