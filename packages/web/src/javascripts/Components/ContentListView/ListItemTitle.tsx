import { FunctionComponent } from 'react'
import { ListableContentItem } from './Types/ListableContentItem'
import Icon from '../Icon/Icon'

export const ListItemTitle: FunctionComponent<{ item: ListableContentItem }> = ({ item }) => {
  return (
    <>
      {item.pinned && (
        <div className="mb-2 inline-flex items-center gap-0.5 rounded bg-info py-1 px-1.5 text-[0.65rem] leading-3 text-info-contrast">
          <Icon type="pin-filled" className="h-3 w-3" size="custom" />
          Pinned
        </div>
      )}
      <div
        className={`break-word mr-2 flex items-start justify-between overflow-hidden text-lg font-semibold leading-[1.3] lg:text-base lg:leading-[1.3] ${
          item.archived ? 'opacity-60' : ''
        }`}
      >
        {item.title}
      </div>
    </>
  )
}
