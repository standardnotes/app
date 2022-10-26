import { formatDateAndTimeForNote } from '@/Utils/DateUtils'
import { SNTag } from '@standardnotes/snjs'
import { FunctionComponent } from 'react'
import ListItemMetadata from '../ListItemMetadata'
import ListItemTags from '../ListItemTags'
import NotePreviewText from '../NotePreviewText'
import { ListableContentItem } from '../Types/ListableContentItem'
import { DailyItemsDaySection } from './DailyItemsDaySection'

type Props = {
  item?: ListableContentItem
  onClick: () => void
  section: DailyItemsDaySection
  selected?: boolean
  tags?: SNTag[]
}

export const CalendarCell: FunctionComponent<Props> = ({ item, tags = [], section, onClick, selected }: Props) => {
  return (
    <div
      onClick={onClick}
      className={`content-list-item flex w-full cursor-pointer items-stretch text-text ${
        selected && 'selected border-l-2 border-solid border-info'
      }`}
      id={section.id}
    >
      <div className="min-w-0 flex-grow border-b border-solid border-border py-4 px-4">
        <div className="flex items-start overflow-hidden text-base">
          <div
            className={`${
              item ? 'bg-danger text-danger-contrast' : 'bg-neutral text-neutral-contrast'
            } mr-3 h-7 w-7 rounded  p-1 text-center text-sm font-bold `}
          >
            {section.day}
          </div>

          <div className="leading-[1.3]">
            {item && (
              <>
                <div className="break-word mr-2 font-semibold">{item.title}</div>
                <NotePreviewText item={item} />
                <ListItemMetadata item={item} hideDate={false} sortBy={'created_at'} />
                <ListItemTags hideTags={false} tags={tags} />
              </>
            )}
            {!item && (
              <div>
                <div className="break-word mr-2 font-semibold">{formatDateAndTimeForNote(section.date, false)}</div>
                <div className="leading-1.3 line-clamp-1 mt-1 overflow-hidden text-sm">No notes yet</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
