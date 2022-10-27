import { ContentType } from '@standardnotes/snjs'
import { FunctionComponent } from 'react'
import FileListItem from './FileListItem'
import NoteListItem from './NoteListItem'
import { AbstractListItemProps } from './Types/AbstractListItemProps'

const ContentListItem: FunctionComponent<AbstractListItemProps> = (props) => {
  switch (props.item.content_type) {
    case ContentType.Note:
      return <NoteListItem {...props} />
    case ContentType.File:
      return <FileListItem {...props} />
    default:
      return null
  }
}

export default ContentListItem
