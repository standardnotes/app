import { ContentType, SNTag } from '@standardnotes/snjs'
import { FunctionComponent } from 'preact'
import { FileListItem } from './FileListItem'
import { NoteListItem } from './NoteListItem'
import { BaseListItemProps } from './Types/BaseListItemProps'

export const ContentListItem: FunctionComponent<BaseListItemProps> = (props) => {
  const getTags = () => {
    if (props.hideTags) {
      return []
    }

    const selectedTag = props.appState.tags.selected
    if (!selectedTag) {
      return []
    }

    const tags = props.appState.getItemTags(props.item)

    const isNavigatingOnlyTag = selectedTag instanceof SNTag && tags.length === 1
    if (isNavigatingOnlyTag) {
      return []
    }

    return tags.map((tag) => tag.title).sort()
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
