import { WebApplication } from '@/Application/Application'
import { calculateSubmenuStyle, SubmenuStyle } from '@/Utils/CalculateSubmenuStyle'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@reach/disclosure'
import { Action, ListedAccount, SNNote } from '@standardnotes/snjs'
import { Fragment, FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'

type Props = {
  application: WebApplication
  note: SNNote
}

type ListedMenuGroup = {
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

const ListedMenuItem: FunctionComponent<ListedMenuItemProps> = ({
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
      className="sn-dropdown-item flex justify-between py-2 text-input focus:bg-info-backdrop focus:shadow-none"
    >
      <div className="flex flex-col">
        <div className="font-semibold">{action.label}</div>
        {action.access_type && (
          <div className="text-xs mt-0.5 color-passive-0">
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

type ListedActionsMenuProps = {
  application: WebApplication
  note: SNNote
  recalculateMenuStyle: () => void
}

const ListedActionsMenu: FunctionComponent<ListedActionsMenuProps> = ({ application, note, recalculateMenuStyle }) => {
  const [menuGroups, setMenuGroups] = useState<ListedMenuGroup[]>([])
  const [isFetchingAccounts, setIsFetchingAccounts] = useState(true)

  const reloadMenuGroup = useCallback(
    async (group: ListedMenuGroup) => {
      const updatedAccountInfo = await application.getListedAccountInfo(group.account, note.uuid)

      if (!updatedAccountInfo) {
        return
      }

      const updatedGroup: ListedMenuGroup = {
        name: updatedAccountInfo.display_name,
        account: group.account,
        actions: updatedAccountInfo.actions as Action[],
      }

      const updatedGroups = menuGroups.map((group) => {
        if (updatedGroup.account.authorId === group.account.authorId) {
          return updatedGroup
        } else {
          return group
        }
      })

      setMenuGroups(updatedGroups)
    },
    [application, menuGroups, note],
  )

  useEffect(() => {
    const fetchListedAccounts = async () => {
      if (!application.hasAccount()) {
        setIsFetchingAccounts(false)
        return
      }

      try {
        const listedAccountEntries = await application.getListedAccounts()

        if (!listedAccountEntries.length) {
          throw new Error('No Listed accounts found')
        }

        const menuGroups: ListedMenuGroup[] = []

        await Promise.all(
          listedAccountEntries.map(async (account) => {
            const accountInfo = await application.getListedAccountInfo(account, note.uuid)

            if (accountInfo) {
              menuGroups.push({
                name: accountInfo.display_name,
                account,
                actions: accountInfo.actions as Action[],
              })
            } else {
              menuGroups.push({
                name: account.authorId,
                account,
                actions: [],
              })
            }
          }),
        )

        setMenuGroups(
          menuGroups.sort((a, b) => {
            return a.name.toString().toLowerCase() < b.name.toString().toLowerCase() ? -1 : 1
          }),
        )
      } catch (err) {
        console.error(err)
      } finally {
        setIsFetchingAccounts(false)
        setTimeout(() => {
          recalculateMenuStyle()
        })
      }
    }

    void fetchListedAccounts()
  }, [application, note.uuid, recalculateMenuStyle])

  return (
    <>
      {isFetchingAccounts && (
        <div className="w-full flex items-center justify-center p-4">
          <div className="sk-spinner w-5 h-5 spinner-info" />
        </div>
      )}
      {!isFetchingAccounts && menuGroups.length ? (
        <>
          {menuGroups.map((group, index) => (
            <Fragment key={group.account.authorId}>
              <div
                className={`w-full flex items-center px-2.5 py-2 text-input font-semibold color-text border-0 border-y-1px border-solid border-main ${
                  index === 0 ? 'border-t-0 mb-1' : 'my-1'
                }`}
              >
                <Icon type="notes" className="mr-2 color-info" /> {group.name}
              </div>
              {group.actions.length ? (
                group.actions.map((action) => (
                  <ListedMenuItem
                    action={action}
                    note={note}
                    key={action.url}
                    group={group}
                    application={application}
                    reloadMenuGroup={reloadMenuGroup}
                  />
                ))
              ) : (
                <div className="px-3 py-2 color-passive-0 select-none">No actions available</div>
              )}
            </Fragment>
          ))}
        </>
      ) : null}
      {!isFetchingAccounts && !menuGroups.length ? (
        <div className="w-full flex items-center justify-center px-4 py-6">
          <div className="color-passive-0 select-none">No Listed accounts found</div>
        </div>
      ) : null}
    </>
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
        <DisclosureButton ref={menuButtonRef} onBlur={closeOnBlur} className="sn-dropdown-item justify-between">
          <div className="flex items-center">
            <Icon type="listed" className="color-neutral mr-2" />
            Listed actions
          </div>
          <Icon type="chevron-right" className="color-neutral" />
        </DisclosureButton>
        <DisclosurePanel
          ref={menuRef}
          style={{
            ...menuStyle,
            position: 'fixed',
          }}
          className="sn-dropdown flex flex-col max-h-120 min-w-68 pb-1 fixed overflow-y-auto"
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
