import { FunctionComponent } from 'preact'
import { Icon } from '@/Components/Icon/Icon'

export const ListItemTags: FunctionComponent<{
  tags: string[]
}> = ({ tags }) => {
  return tags.length ? (
    <div className="flex flex-wrap mt-1.5 text-xs gap-2">
      {tags.map((tag) => (
        <span className="inline-flex items-center py-1 px-1.5 bg-grey-4-opacity-variant color-foreground rounded-0.5">
          <Icon type="hashtag" className="sn-icon--small color-grey-1 mr-1" />
          <span>{tag}</span>
        </span>
      ))}
    </div>
  ) : null
}
