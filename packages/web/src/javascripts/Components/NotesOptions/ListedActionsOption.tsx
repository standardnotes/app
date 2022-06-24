import { WebApplication } from '@/Application/Application'
import { calculateSubmenuStyle, SubmenuStyle } from '@/Utils/CalculateSubmenuStyle'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@reach/disclosure'
import { Action, ListedAccount, SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import ListedActionsMenu from './ListedActionsMenu'

type Props = {
  application: WebApplication
  note: SNNote
}

export type ListedMenuGroup = {
  name: string
  account: ListedAccount
  actions: Action[]
}

type ListedMenuItemProps = {
  action: Action
  note: SNNote
  group: ListedMenuGroup
  application: WebApplication
  reloadMenuGroup: (group: ListedMenuGroup) => Promise<void>
}

export const ListedMenuItem: FunctionComponent<ListedMenuItemProps> = ({
  action,
  note,
  application,
  group,
  reloadMenuGroup,
}) => {
  const [isRunning, setIsRunning] = useState(false)

  const handleClick = useCallback(async () => {
    if (isRunning) {
      return
    }

    setIsRunning(true)

    await application.actionsManager.runAction(action, note)

    setIsRunning(false)

    reloadMenuGroup(group).catch(console.error)
  }, [application, action, group, isRunning, note, reloadMenuGroup])

  return (
    <button
      key={action.url}
      onClick={handleClick}
      className="flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-2 text-left w-full focus:bg-info-backdrop focus:shadow-none text-sm"
    >
      <div className="flex flex-col">
        <div className="font-semibold">{action.label}</div>
        {action.access_type && (
          <div className="text-xs mt-0.5 text-passive-0">
            {'Uses '}
            <strong>{action.access_type}</strong>
            {' access to this note.'}
          </div>
        )}
      </div>
      {isRunning && <div className="sk-spinner spinner-info w-3 h-3" />}
    </button>
  )
}

const ListedActionsOption: FunctionComponent<Props> = ({ application, note }) => {
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<SubmenuStyle>({
    right: 0,
    bottom: 0,
    maxHeight: 'auto',
  })

  const [closeOnBlur] = useCloseOnBlur(menuContainerRef, setIsMenuOpen)

  const toggleListedMenu = useCallback(() => {
    if (!isMenuOpen) {
      const menuPosition = calculateSubmenuStyle(menuButtonRef.current)
      if (menuPosition) {
        setMenuStyle(menuPosition)
      }
    }

    setIsMenuOpen(!isMenuOpen)
  }, [isMenuOpen])

  const recalculateMenuStyle = useCallback(() => {
    const newMenuPosition = calculateSubmenuStyle(menuButtonRef.current, menuRef.current)

    if (newMenuPosition) {
      setMenuStyle(newMenuPosition)
    }
  }, [])

  useEffect(() => {
    if (isMenuOpen) {
      setTimeout(() => {
        recalculateMenuStyle()
      })
    }
  }, [isMenuOpen, recalculateMenuStyle])

  return (
    <div ref={menuContainerRef}>
      <Disclosure open={isMenuOpen} onChange={toggleListedMenu}>
        <DisclosureButton
          ref={menuButtonRef}
          onBlur={closeOnBlur}
          className="flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-1.5 text-left w-full focus:bg-info-backdrop focus:shadow-none text-sm justify-between"
        >
          <div className="flex items-center">
            <Icon type="listed" className="text-neutral mr-2" />
            Listed actions
          </div>
          <Icon type="chevron-right" className="text-neutral" />
        </DisclosureButton>
        <DisclosurePanel
          ref={menuRef}
          style={{
            ...menuStyle,
            position: 'fixed',
          }}
          className="bg-default rounded-md shadow-md flex flex-col max-h-120 min-w-68 pb-1 fixed overflow-y-auto"
        >
          {isMenuOpen && (
            <ListedActionsMenu application={application} note={note} recalculateMenuStyle={recalculateMenuStyle} />
          )}
        </DisclosurePanel>
      </Disclosure>
    </div>
  )
}

export default ListedActionsOption
