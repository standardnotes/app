import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { KeyboardKey } from '@standardnotes/ui-services'
import Popover from '../Popover/Popover'
import { classNames, DecryptedItemInterface, GroupServerHash, isClientDisplayableError } from '@standardnotes/snjs'
import { useApplication } from '../ApplicationProvider'
import MenuItem from '../Menu/MenuItem'
import Menu from '../Menu/Menu'

type Props = {
  iconClassName: string
  selectedItems: DecryptedItemInterface[]
}

const AddToGroupOption: FunctionComponent<Props> = ({ iconClassName, selectedItems }) => {
  const application = useApplication()
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const [groups, setGroups] = useState<GroupServerHash[]>([])

  useEffect(() => {
    const reloadGroups = async () => {
      const groups = await application.groups.reloadGroups()
      if (!isClientDisplayableError(groups)) {
        setGroups(groups)
      }
    }
    setGroups(application.groups.getGroups())
    void reloadGroups()
  }, [application.groups])

  const getGroupData = (group: GroupServerHash) => {
    const groupKey = application.groups.getGroupKey(group.uuid)
    return groupKey
  }

  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = useCallback(() => {
    setIsOpen((isOpen) => !isOpen)
  }, [])

  const addItemsToGroup = useCallback(
    async (group: GroupServerHash) => {
      for (const item of selectedItems) {
        await application.groups.addItemToGroup(group, item)
      }
    },
    [application.groups, selectedItems],
  )

  const removeItemsFromGroup = useCallback(async () => {
    for (const item of selectedItems) {
      await application.groups.removeItemFromItsGroup(item)
    }
  }, [application.groups, selectedItems])

  const doesGroupContainItems = (group: GroupServerHash) => {
    return selectedItems.every((item) => item.group_uuid === group.uuid)
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
      >
        <div className="flex items-center">
          <Icon type="share" className={iconClassName} />
          Add to shared group
        </div>
        <Icon type="chevron-right" className="text-neutral" />
      </MenuItem>
      <Popover
        title="Add to shared group"
        togglePopover={toggleMenu}
        anchorElement={buttonRef.current}
        open={isOpen}
        side="right"
        align="start"
        className="py-2"
        overrideZIndex="z-modal"
      >
        <Menu a11yLabel="Group selection menu" isOpen={isOpen}>
          {groups.map((group) => (
            <MenuItem
              key={group.uuid}
              onClick={() => {
                doesGroupContainItems(group) ? void removeItemsFromGroup() : void addItemsToGroup(group)
              }}
            >
              <span
                className={classNames(
                  'overflow-hidden overflow-ellipsis whitespace-nowrap',
                  doesGroupContainItems(group) ? 'font-bold' : '',
                )}
              >
                Group UUID: {group.uuid}
                Group Name: {getGroupData(group)?.groupName}
              </span>
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </div>
  )
}

export default observer(AddToGroupOption)
