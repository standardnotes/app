import { WebApplication } from '@/Application/Application'
import { SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import ListedActionsMenu from './ListedActionsMenu'
import { KeyboardKey } from '@standardnotes/ui-services'
import Popover from '../Popover/Popover'

type Props = {
  application: WebApplication
  note: SNNote
}

const ListedActionsOption: FunctionComponent<Props> = ({ application, note }) => {
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
      <button
        onClick={toggleMenu}
        onKeyDown={(event) => {
          if (event.key === KeyboardKey.Escape) {
            setIsOpen(false)
          }
        }}
        ref={buttonRef}
        className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-3 py-1.5 text-left text-mobile-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none md:text-menu-item"
      >
        <div className="flex items-center">
          <Icon type="listed" className="mr-2 text-neutral" />
          Listed actions
        </div>
        <Icon type="chevron-right" className="text-neutral" />
      </button>
      <Popover
        togglePopover={toggleMenu}
        anchorElement={buttonRef.current}
        open={isOpen}
        side="right"
        align="end"
        className="pt-2 md:pt-0"
      >
        <ListedActionsMenu application={application} note={note} />
      </Popover>
    </div>
  )
}

export default ListedActionsOption
