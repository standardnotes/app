import { FunctionComponent } from 'react'
import { ListableContentItem } from './Types/ListableContentItem'

type Props = {
  item: {
    conflictOf?: ListableContentItem['conflictOf']
  }
}

const ListItemConflictIndicator: FunctionComponent<Props> = ({ item }) => {
  return item.conflictOf ? (
    <div className="flex flex-wrap items-center mt-0.5">
      <div className={'py-1 px-1.5 rounded mr-1 mt-2 bg-danger color-danger-contrast'}>
        <div className="text-xs font-bold text-center">Conflicted Copy</div>
      </div>
    </div>
  ) : null
}

export default ListItemConflictIndicator
