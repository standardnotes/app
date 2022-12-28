import { ContentType, FeatureIdentifier, FileItem, SNNote } from '@standardnotes/snjs'
import React, { FunctionComponent } from 'react'
import FileListItem from './FileListItem'
import FileListItemCard from './FileListItemCard'
import NoteListItem from './NoteListItem'
import { AbstractListItemProps, doListItemPropsMeritRerender } from './Types/AbstractListItemProps'
import { ListableContentItem } from './Types/ListableContentItem'

const ContentListItem: FunctionComponent<AbstractListItemProps<ListableContentItem>> = (props) => {
  const isFilesTableViewEnabled = props.application.features.isExperimentalFeatureEnabled(
    FeatureIdentifier.FilesTableView,
  )

  switch (props.item.content_type) {
    case ContentType.Note:
      return <NoteListItem {...props} item={props.item as SNNote} />
    case ContentType.File: {
      if (isFilesTableViewEnabled) {
        return <FileListItem {...props} item={props.item as FileItem} />
      }

      return <FileListItemCard {...props} item={props.item as FileItem} />
    }
    default:
      return null
  }
}

export default React.memo(ContentListItem, (a, b) => !doListItemPropsMeritRerender(a, b))
