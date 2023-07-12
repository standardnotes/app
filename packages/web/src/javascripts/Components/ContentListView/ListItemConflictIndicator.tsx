import { FunctionComponent } from 'react'
import { ListableContentItem } from './Types/ListableContentItem'

type Props = {
  item: {
    conflictOf?: ListableContentItem['conflictOf']
  }
}

const ListItemConflictIndicator: FunctionComponent<Props> = ({ item }) => {
  return item.conflictOf ? (
    <div className="mt-0.5 flex flex-wrap items-center">
      <div className={'mr-1 mt-2 rounded bg-danger px-1.5 py-1 text-danger-contrast'}>
        <div className="text-center text-xs font-bold">Conflicted Copy</div>
      </div>
    </div>
  ) : null
}

export default ListItemConflictIndicator
