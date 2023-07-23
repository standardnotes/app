import { WebApplication } from '@/Application/WebApplication'
import { Action, SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useState } from 'react'
import Spinner from '@/Components/Spinner/Spinner'
import { ListedMenuGroup } from './ListedMenuGroup'

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

    await application.actions.runAction(action, note)

    setIsRunning(false)

    reloadMenuGroup(group).catch(console.error)
  }, [application, action, group, isRunning, note, reloadMenuGroup])

  return (
    <button
      key={action.url}
      onClick={handleClick}
      className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-2 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
    >
      <div className="flex w-full flex-row items-center justify-between">
        <div className="flex flex-col">
          <div className="font-semibold">{action.label}</div>
          {action.access_type && (
            <div className="mt-0.5 text-xs text-passive-0">
              {'Uses '}
              <strong>{action.access_type}</strong>
              {' access to this note.'}
            </div>
          )}
        </div>
        {isRunning && <Spinner className="h-3 w-3" />}
      </div>
    </button>
  )
}

export default ListedMenuItem
