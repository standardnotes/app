import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import { KeyboardKey } from '@standardnotes/ui-services'
import Popover from '../Popover/Popover'
import { IconType } from '@standardnotes/snjs'
import { getTitleForLinkedTag } from '@/Utils/Items/Display/getTitleForLinkedTag'
import { useApplication } from '../ApplicationProvider'
import MenuItem from '../Menu/MenuItem'
import Menu from '../Menu/Menu'

type Props = {
  navigationController: NavigationController
  notesController: NotesController
  iconClassName: string
}

const AddTagOption: FunctionComponent<Props> = ({ navigationController, notesController, iconClassName }) => {
  const application = useApplication()
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = useCallback(() => {
    setIsOpen((isOpen) => !isOpen)
  }, [])

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
          <Icon type="hashtag" className={`${iconClassName} mr-2 text-neutral`} />
          Add tag
        </div>
        <Icon type="chevron-right" className="text-neutral" />
      </MenuItem>
      <Popover
        togglePopover={toggleMenu}
        anchorElement={buttonRef.current}
        open={isOpen}
        side="right"
        align="start"
        className="py-2"
      >
        <Menu a11yLabel="Tag selection menu" isOpen={isOpen}>
          {navigationController.tags.map((tag) => (
            <MenuItem
              key={tag.uuid}
              onClick={() => {
                notesController.isTagInSelectedNotes(tag)
                  ? notesController.removeTagFromSelectedNotes(tag).catch(console.error)
                  : notesController.addTagToSelectedNotes(tag).catch(console.error)
              }}
            >
              {tag.iconString && (
                <Icon
                  type={tag.iconString as IconType}
                  size={'custom'}
                  className={'ml-0.5 mr-1.5 h-7 w-7 text-2xl text-neutral lg:h-6 lg:w-6 lg:text-lg'}
                />
              )}
              <span
                className={`overflow-hidden overflow-ellipsis whitespace-nowrap
                        ${notesController.isTagInSelectedNotes(tag) ? 'font-bold' : ''}`}
              >
                {getTitleForLinkedTag(tag, application)?.longTitle}
              </span>
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </div>
  )
}

export default observer(AddTagOption)
