import { ContentType, FileItem, SNNote } from '@standardnotes/snjs'
import React, { FunctionComponent } from 'react'
import FileListItem from './FileListItem'
import NoteListItem from './NoteListItem'
import { AbstractListItemProps, doListItemPropsMeritRerender } from './Types/AbstractListItemProps'
import { ListableContentItem } from './Types/ListableContentItem'

const ContentListItem: FunctionComponent<AbstractListItemProps<ListableContentItem>> = (props) => {
  switch (props.item.content_type) {
    case ContentType.TYPES.Note:
      return <NoteListItem {...props} item={props.item as SNNote} />
    case ContentType.TYPES.File: {
      return <FileListItem {...props} item={props.item as FileItem} />
    }
    default:
      return null
  }
}

export default React.memo(ContentListItem, (a, b) => !doListItemPropsMeritRerender(a, b))
