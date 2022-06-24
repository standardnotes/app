import { WebApplication } from '@/Application/Application'
import { Action, SNNote } from '@standardnotes/snjs'
import { Fragment, useCallback, useEffect, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { ListedMenuGroup } from './ListedMenuGroup'
import ListedMenuItem from './ListedMenuItem'

type ListedActionsMenuProps = {
  application: WebApplication
  note: SNNote
  recalculateMenuStyle: () => void
}

const ListedActionsMenu = ({ application, note, recalculateMenuStyle }: ListedActionsMenuProps) => {
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
          <div className="animate-spin border border-solid border-info border-r-transparent rounded-full w-5 h-5 " />
        </div>
      )}
      {!isFetchingAccounts && menuGroups.length ? (
        <>
          {menuGroups.map((group, index) => (
            <Fragment key={group.account.authorId}>
              <div
                className={`w-full flex items-center px-2.5 py-2 text-input font-semibold text-text border-y border-solid border-border ${
                  index === 0 ? 'border-t-0 mb-1' : 'my-1'
                }`}
              >
                <Icon type="notes" className="mr-2 text-info" /> {group.name}
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
                <div className="px-3 py-2 text-sm text-passive-0 select-none">No actions available</div>
              )}
            </Fragment>
          ))}
        </>
      ) : null}
      {!isFetchingAccounts && !menuGroups.length ? (
        <div className="w-full flex items-center justify-center px-4 py-6">
          <div className="text-sm text-passive-0 select-none">No Listed accounts found</div>
        </div>
      ) : null}
    </>
  )
}

export default ListedActionsMenu
