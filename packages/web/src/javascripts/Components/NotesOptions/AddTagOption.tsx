import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NotesController } from '@/Controllers/NotesController'
import { KeyboardKey } from '@standardnotes/ui-services'
import Popover from '../Popover/Popover'
import { LinkingController } from '@/Controllers/LinkingController'

type Props = {
  navigationController: NavigationController
  notesController: NotesController
  linkingController: LinkingController
}

const AddTagOption: FunctionComponent<Props> = ({ navigationController, notesController, linkingController }) => {
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = useCallback(() => {
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
        className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-3 py-1.5 text-left text-mobile-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none md:text-menu-item"
      >
        <div className="flex items-center">
          <Icon type="hashtag" className="mr-2 text-neutral" />
          Add tag
        </div>
        <Icon type="chevron-right" className="text-neutral" />
      </button>
      <Popover
        togglePopover={toggleMenu}
        anchorElement={buttonRef.current}
        open={isOpen}
        side="right"
        align="start"
        className="py-2"
      >
        {navigationController.tags.map((tag) => (
          <button
            key={tag.uuid}
            className="max-w-80 flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-2 text-left text-mobile-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none md:text-menu-item"
            onClick={() => {
              notesController.isTagInSelectedNotes(tag)
                ? notesController.removeTagFromSelectedNotes(tag).catch(console.error)
                : notesController.addTagToSelectedNotes(tag).catch(console.error)
            }}
          >
            <span
              className={`overflow-hidden overflow-ellipsis whitespace-nowrap
                      ${notesController.isTagInSelectedNotes(tag) ? 'font-bold' : ''}`}
            >
              {linkingController.getTitleForLinkedTag(tag)?.longTitle}
            </span>
          </button>
        ))}
      </Popover>
    </div>
  )
}

export default observer(AddTagOption)
