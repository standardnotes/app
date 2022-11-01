import { FunctionComponent } from 'react'
import Icon from '@/Components/Icon/Icon'
import { DisplayableListItemProps } from './Types/DisplayableListItemProps'

type Props = {
  hideTags: boolean
  tags: DisplayableListItemProps['tags']
}

const ListItemTags: FunctionComponent<Props> = ({ hideTags, tags }) => {
  if (hideTags || !tags.length) {
    return null
  }

  return (
    <div className="mt-1.5 flex flex-wrap gap-2 text-sm lg:text-xs">
      {tags.map((tag) => (
        <span
          className="inline-flex items-center rounded-sm bg-passive-4-opacity-variant py-1 px-1.5 text-foreground"
          key={tag.uuid}
        >
          <Icon type={tag.iconString} className="mr-1 text-passive-1" size="small" />
          <span>{tag.title}</span>
        </span>
      ))}
    </div>
  )
}

export default ListItemTags
