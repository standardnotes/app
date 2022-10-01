import { LinkableItem, LinkingController } from '@/Controllers/LinkingController'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { IconType } from '@standardnotes/snjs/dist/@types'
import { useState, useRef, useCallback } from 'react'
import Icon from '../Icon/Icon'
import Popover from '../Popover/Popover'

const LinkedItem = ({
  item,
  getItemIcon,
  getItemTitle,
}: {
  item: LinkableItem
  getItemIcon: (item: LinkableItem) => [IconType, string]
  getItemTitle: (item: LinkableItem) => JSX.Element
}) => {
  const [icon, className] = getItemIcon(item)

  return (
    <div className="flex items-center justify-between gap-4 py-1 px-3">
      <Icon type={icon} className={classNames('flex-shrink-0', className)} />
      <div className="flex-grow text-left">{getItemTitle(item)}</div>
      <button className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-1 hover:bg-contrast">
        <Icon type="more" className="text-neutral" />
      </button>
    </div>
  )
}

type Props = {
  linkingController: LinkingController
  onClickPreprocessing?: () => Promise<void>
}

const LinkedItemsButton = ({ linkingController, onClickPreprocessing }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { tags, files, notes, getLinkedItemTitle, getLinkedItemIcon } = linkingController

  const toggleMenu = useCallback(async () => {
    const willMenuOpen = !isOpen
    if (willMenuOpen && onClickPreprocessing) {
      await onClickPreprocessing()
    }
    setIsOpen(willMenuOpen)
  }, [onClickPreprocessing, isOpen])

  return (
    <>
      <button
        className="bg-text-padding flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border text-neutral hover:bg-contrast focus:bg-contrast"
        title="Linked items panel"
        aria-label="Linked items panel"
        onClick={toggleMenu}
        ref={buttonRef}
      >
        <Icon type="link" />
      </button>
      <Popover togglePopover={toggleMenu} anchorElement={buttonRef.current} open={isOpen} className="py-2">
        <div className="my-1 px-3 text-menu-item font-semibold uppercase text-text">Linked Tags</div>
        <div className="my-1">
          {tags.map((tag) => (
            <LinkedItem item={tag} getItemIcon={getLinkedItemIcon} getItemTitle={getLinkedItemTitle} key={tag.uuid} />
          ))}
        </div>
        <div className="my-1 px-3 text-menu-item font-semibold uppercase text-text">Linked Files</div>
        <div className="my-1">
          {files.map((file) => (
            <LinkedItem item={file} getItemIcon={getLinkedItemIcon} getItemTitle={getLinkedItemTitle} key={file.uuid} />
          ))}
        </div>
        <div className="my-1 px-3 text-menu-item font-semibold uppercase text-text">Linked Notes</div>
        <div className="my-1">
          {notes.map((note) => (
            <LinkedItem item={note} getItemIcon={getLinkedItemIcon} getItemTitle={getLinkedItemTitle} key={note.uuid} />
          ))}
        </div>
      </Popover>
    </>
  )
}

export default LinkedItemsButton
