import { sanitizeHtmlString } from '@standardnotes/snjs'
import { FunctionComponent } from 'react'
import { ListableContentItem } from './Types/ListableContentItem'

type Props = {
  item: ListableContentItem
  hidePreview: boolean
  lineLimit?: number
}

const ListItemNotePreviewText: FunctionComponent<Props> = ({ item, hidePreview, lineLimit = 1 }) => {
  if (item.hidePreview || item.protected || hidePreview) {
    return null
  }

  return (
    <div className={`overflow-hidden overflow-ellipsis text-base lg:text-sm ${item.archived ? 'opacity-60' : ''}`}>
      {item.preview_html && (
        <div
          className="my-1"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtmlString(item.preview_html),
          }}
        ></div>
      )}
      {!item.preview_html && item.preview_plain && (
        <div className={`leading-1.3 line-clamp-${lineLimit} mt-1 overflow-hidden`}>{item.preview_plain}</div>
      )}
      {!item.preview_html && !item.preview_plain && item.text && (
        <div className={`leading-1.3 line-clamp-${lineLimit} mt-1 overflow-hidden`}>{item.text}</div>
      )}
    </div>
  )
}

export default ListItemNotePreviewText
