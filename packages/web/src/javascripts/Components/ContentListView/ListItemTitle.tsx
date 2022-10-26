import { FunctionComponent } from 'react'
import { ListableContentItem } from './Types/ListableContentItem'

export const ListItemTitle: FunctionComponent<{ item: ListableContentItem }> = ({ item }) => {
  return (
    <div className="flex items-start justify-between overflow-hidden text-base font-semibold leading-[1.3]">
      <div className={`break-word mr-2 ${item.archived ? 'opacity-60' : ''}`}>{item.title}</div>
    </div>
  )
}
