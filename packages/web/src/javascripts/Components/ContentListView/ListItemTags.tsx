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
    <div className="flex flex-wrap mt-1.5 text-xs gap-2">
      {tags.map((tag) => (
        <span
          className="inline-flex items-center py-1 px-1.5 bg-passive-4-opacity-variant text-foreground rounded-sm"
          key={tag.uuid}
        >
          <Icon type="hashtag" className="text-passive-1 mr-1" size="small" />
          <span>{tag.title}</span>
        </span>
      ))}
    </div>
  )
}

export default ListItemTags
