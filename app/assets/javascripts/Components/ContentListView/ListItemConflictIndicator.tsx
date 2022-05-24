import { FunctionComponent } from 'react'
import { ListableContentItem } from './Types/ListableContentItem'

export const ListItemConflictIndicator: FunctionComponent<{
  item: {
    conflictOf?: ListableContentItem['conflictOf']
  }
}> = ({ item }) => {
  return item.conflictOf ? (
    <div className="flex flex-wrap items-center mt-0.5">
      <div className={'py-1 px-1.5 rounded mr-1 mt-2 bg-danger color-danger-contrast'}>
        <div className="text-xs font-bold text-center">Conflicted Copy</div>
      </div>
    </div>
  ) : null
}
