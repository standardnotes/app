import { FunctionComponent } from 'react'
import { ListableContentItem } from './Types/ListableContentItem'

export const ListItemTitle: FunctionComponent<{ item: ListableContentItem }> = ({ item }) => {
  return (
    <div
      className={`break-word mr-2 flex items-start justify-between overflow-hidden text-lg font-semibold leading-[1.3] lg:text-base lg:leading-[1.3] ${
        item.archived ? 'opacity-60' : ''
      }`}
    >
      {item.title}
    </div>
  )
}
