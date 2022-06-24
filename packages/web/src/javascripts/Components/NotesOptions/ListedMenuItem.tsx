import { WebApplication } from '@/Application/Application'
import { Action, SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useState } from 'react'
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
      {isRunning && (
        <div className="animate-spin border border-solid border-info border-r-transparent rounded-full  w-3 h-3" />
      )}
    </button>
  )
}

export default ListedMenuItem
