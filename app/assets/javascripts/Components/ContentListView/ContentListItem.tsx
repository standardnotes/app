import { ContentType, SNTag } from '@standardnotes/snjs'
import { FunctionComponent } from 'preact'
import { FileListItem } from './FileListItem'
import { NoteListItem } from './NoteListItem'
import { BaseListItemProps } from './types'

export const ContentListItem: FunctionComponent<BaseListItemProps> = (props) => {
  const tags = () => {
    if (props.hideTags) {
      return []
    }
    const selectedTag = props.appState.tags.selected
    if (!selectedTag) {
      return []
    }
    const tags = props.appState.getItemTags(props.item)
    if (selectedTag instanceof SNTag && tags.length === 1) {
      return []
    }
    return tags.map((tag) => tag.title).sort()
  }

  switch (props.item.content_type) {
    case ContentType.Note:
      return <NoteListItem tags={tags()} {...props} />
    case ContentType.File:
      return <FileListItem tags={tags()} {...props} />
    default:
      return null
  }
}
