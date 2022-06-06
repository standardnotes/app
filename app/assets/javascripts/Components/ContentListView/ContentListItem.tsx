import { ContentType, SNTag } from '@standardnotes/snjs'
import { FunctionComponent } from 'react'
import FileListItem from './FileListItem'
import NoteListItem from './NoteListItem'
import { AbstractListItemProps } from './Types/AbstractListItemProps'

const ContentListItem: FunctionComponent<AbstractListItemProps> = (props) => {
  const getTags = () => {
    if (props.hideTags) {
      return []
    }

    const selectedTag = props.navigationController.selected
    if (!selectedTag) {
      return []
    }

    const tags = props.application.getItemTags(props.item)

    const isNavigatingOnlyTag = selectedTag instanceof SNTag && tags.length === 1
    if (isNavigatingOnlyTag) {
      return []
    }

    return tags
  }

  switch (props.item.content_type) {
    case ContentType.Note:
      return <NoteListItem tags={getTags()} {...props} />
    case ContentType.File:
      return <FileListItem tags={getTags()} {...props} />
    default:
      return null
  }
}

export default ContentListItem
