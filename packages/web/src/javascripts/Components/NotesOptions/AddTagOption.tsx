import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NotesController } from '@/Controllers/NotesController'
import { KeyboardKey } from '@standardnotes/ui-services'
import Popover from '../Popover/Popover'
import { IconType } from '@standardnotes/snjs'
import { getTitleForLinkedTag } from '@/Utils/Items/Display/getTitleForLinkedTag'
import { useApplication } from '../ApplicationView/ApplicationProvider'

type Props = {
  navigationController: NavigationController
  notesController: NotesController
  className: string
  iconClassName: string
}

const AddTagOption: FunctionComponent<Props> = ({
  navigationController,
  notesController,
  className,
  iconClassName,
}) => {
  const application = useApplication()
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
        className={className}
      >
        <div className="flex items-center">
          <Icon type="hashtag" className={`${iconClassName} mr-2 text-neutral`} />
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
            className={`max-w-80 ${className.replace('justify-between', 'justify-start')}`}
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
          </button>
        ))}
      </Popover>
    </div>
  )
}

export default observer(AddTagOption)
