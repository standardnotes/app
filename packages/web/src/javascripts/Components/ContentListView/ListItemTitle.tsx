import { FunctionComponent } from 'react'
import { ListableContentItem } from './Types/ListableContentItem'
import Icon from '../Icon/Icon'
import { classNames } from '@standardnotes/snjs'

export const ListItemTitle: FunctionComponent<{ item: ListableContentItem }> = ({ item }) => {
  return (
    <div
      className={classNames(
        'break-word mr-2 overflow-hidden text-lg font-semibold leading-[1.3] lg:text-base lg:leading-[1.3]',
        item.archived ? 'opacity-60' : '',
      )}
    >
      {item.pinned && (
        <span className="mr-1.5 inline-flex rounded-full bg-info p-0.5 text-info-contrast">
          <Icon type="pin-filled" size="custom" className="h-3 w-3" />
        </span>
      )}
      {item.title}
    </div>
  )
}
