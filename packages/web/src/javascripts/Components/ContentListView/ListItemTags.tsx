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
          className="inline-flex items-center py-1 px-1.5 bg-passive-4-opacity-variant color-foreground rounded-0.5"
          key={tag.uuid}
        >
          <Icon type="hashtag" className="sn-icon--small color-passive-1 mr-1" />
          <span>{tag.title}</span>
        </span>
      ))}
    </div>
  )
}

export default ListItemTags
