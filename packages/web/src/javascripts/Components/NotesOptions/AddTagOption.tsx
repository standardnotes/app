import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { KeyboardKey } from '@standardnotes/ui-services'
import Popover from '../Popover/Popover'
import { classNames, DecryptedItemInterface, IconType, SNTag } from '@standardnotes/snjs'
import { getTitleForLinkedTag } from '@/Utils/Items/Display/getTitleForLinkedTag'
import { useApplication } from '../ApplicationProvider'
import MenuItem from '../Menu/MenuItem'
import Menu from '../Menu/Menu'
import { LinkingController } from '@/Controllers/LinkingController'

type Props = {
  navigationController: NavigationController
  linkingController: LinkingController
  selectedItems: DecryptedItemInterface[]
  iconClassName: string
  disabled?: boolean
}

const AddTagOption: FunctionComponent<Props> = ({
  navigationController,
  linkingController,
  selectedItems,
  iconClassName,
  disabled,
}) => {
  const application = useApplication()
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = useCallback(() => {
    setIsOpen((isOpen) => !isOpen)
  }, [])

  const isTagLinkedToSelectedItems = (tag: SNTag) => {
    return selectedItems.every((item) => application.getItemTags(item).find((itemTag) => itemTag.uuid === tag.uuid))
  }

  const linkTagToSelectedItems = (tag: SNTag) => {
    selectedItems.forEach((item) => linkingController.linkItems(item, tag))
  }

  const unlinkTagFromSelectedItems = (tag: SNTag) => {
    selectedItems.forEach((item) => linkingController.unlinkItems(item, tag))
  }

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
        disabled={disabled}
      >
        <div className="flex items-center">
          <Icon type="hashtag" className={iconClassName} />
          Add tag
        </div>
        <Icon type="chevron-right" className="text-neutral" />
      </MenuItem>
      <Popover
        title="Add tag"
        togglePopover={toggleMenu}
        anchorElement={buttonRef}
        open={isOpen}
        side="right"
        align="start"
        className="py-2"
        overrideZIndex="z-modal"
      >
        <Menu a11yLabel="Tag selection menu" className="!px-0">
          {navigationController.tags.map((tag) => (
            <MenuItem
              key={tag.uuid}
              onClick={() => {
                isTagLinkedToSelectedItems(tag) ? unlinkTagFromSelectedItems(tag) : linkTagToSelectedItems(tag)
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
                className={classNames(
                  'overflow-hidden overflow-ellipsis whitespace-nowrap',
                  isTagLinkedToSelectedItems(tag) ? 'font-bold' : '',
                )}
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
