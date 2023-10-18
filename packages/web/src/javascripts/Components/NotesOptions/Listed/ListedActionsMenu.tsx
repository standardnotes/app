import { WebApplication } from '@/Application/WebApplication'
import { Action, SNNote } from '@standardnotes/snjs'
import { useCallback, useEffect, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { ListedMenuGroup } from './ListedMenuGroup'
import ListedMenuItem from './ListedMenuItem'
import Spinner from '@/Components/Spinner/Spinner'
import MenuSection from '@/Components/Menu/MenuSection'

type ListedActionsMenuProps = {
  application: WebApplication
  note: SNNote
}

const ListedActionsMenu = ({ application, note }: ListedActionsMenuProps) => {
  const [menuGroups, setMenuGroups] = useState<ListedMenuGroup[]>([])
  const [isFetchingAccounts, setIsFetchingAccounts] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const authorize = async () => {
      if (!application.listed.isNoteAuthorizedForListed(note)) {
        await application.listed.authorizeNoteForListed(note)
      }

      setIsAuthorized(application.listed.isNoteAuthorizedForListed(note))
    }

    void authorize()
  }, [application, note])

  const reloadMenuGroup = useCallback(
    async (group: ListedMenuGroup) => {
      if (!isAuthorized) {
        return
      }

      const updatedAccountInfo = await application.listed.getListedAccountInfo(group.account, note.uuid)

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
    [application, menuGroups, note, isAuthorized],
  )

  useEffect(() => {
    const fetchListedAccounts = async () => {
      if (!application.hasAccount()) {
        setIsFetchingAccounts(false)
        return
      }

      if (!isAuthorized) {
        return
      }

      try {
        const listedAccountEntries = await application.listed.getListedAccounts()

        if (!listedAccountEntries.length) {
          throw new Error('No Listed accounts found')
        }

        const menuGroups: ListedMenuGroup[] = []
        await Promise.all(
          listedAccountEntries.map(async (account) => {
            const accountInfo = await application.listed.getListedAccountInfo(account, note.uuid)
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
      }
    }

    void fetchListedAccounts()
  }, [application, note.uuid, isAuthorized])

  if (!isAuthorized) {
    return null
  }

  return (
    <>
      {isFetchingAccounts && (
        <div className="flex w-full items-center justify-center p-4">
          <Spinner className="h-5 w-5" />
        </div>
      )}
      {!isFetchingAccounts && menuGroups.length ? (
        <>
          {menuGroups.map((group) => (
            <MenuSection
              key={group.account.authorId}
              title={
                <div className="flex items-center">
                  <Icon type="notes" className="mr-2 text-info" /> {group.name}
                </div>
              }
            >
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
                <div className="select-none px-3 py-2 text-sm text-passive-0">No actions available</div>
              )}
            </MenuSection>
          ))}
        </>
      ) : null}
      {!isFetchingAccounts && !menuGroups.length ? (
        <div className="flex w-full items-center justify-center px-4 py-6">
          <div className="select-none text-sm text-passive-0">No Listed accounts found</div>
        </div>
      ) : null}
    </>
  )
}

export default ListedActionsMenu
