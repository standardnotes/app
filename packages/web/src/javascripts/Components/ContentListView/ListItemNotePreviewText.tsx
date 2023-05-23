import { classNames, sanitizeHtmlString, SNNote } from '@standardnotes/snjs'
import { FunctionComponent } from 'react'

type Props = {
  item: SNNote
  hidePreview: boolean
  lineLimit?: number
}

const ListItemNotePreviewText: FunctionComponent<Props> = ({ item, hidePreview, lineLimit = 1 }) => {
  if (item.hidePreview || item.protected || hidePreview) {
    return null
  }

  return (
    <div
      className={classNames(
        'overflow-hidden overflow-ellipsis text-base lg:text-sm',
        item.archived ? 'opacity-60' : '',
      )}
    >
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
    </div>
  )
}

export default ListItemNotePreviewText
