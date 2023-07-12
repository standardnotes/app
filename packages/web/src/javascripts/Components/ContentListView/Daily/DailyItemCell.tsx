import { formatDateAndTimeForNote } from '@/Utils/DateUtils'
import { isNote, SNTag } from '@standardnotes/snjs'
import { ComponentPropsWithoutRef, forwardRef, FunctionComponent, Ref } from 'react'
import ListItemFlagIcons from '../ListItemFlagIcons'
import ListItemMetadata from '../ListItemMetadata'
import ListItemTags from '../ListItemTags'
import ListItemNotePreviewText from '../ListItemNotePreviewText'
import { ListableContentItem } from '../Types/ListableContentItem'
import { DailyItemsDay } from './DailyItemsDaySection'
import { ListItemTitle } from '../ListItemTitle'
import { EmptyPlaceholderBars } from './EmptyPlaceholderBars'

type DaySquareProps = {
  day: number
  hasActivity: boolean
  weekday: string
}

const DaySquare: FunctionComponent<DaySquareProps> = ({ day, hasActivity, weekday }) => {
  return (
    <div className="mr-5">
      <div
        className={`${
          hasActivity ? 'bg-danger text-danger-contrast' : 'bg-neutral text-neutral-contrast'
        } h-19 w-18 rounded p-2 text-center`}
      >
        <div className="text-sm font-bold">{weekday}</div>
        <div className="text-4xl font-bold">{day}</div>
      </div>
    </div>
  )
}

interface Props extends ComponentPropsWithoutRef<'div'> {
  item?: ListableContentItem
  onClick: () => void
  section: DailyItemsDay
  selected?: boolean
  tags?: SNTag[]
  hideDate?: boolean
  hideTags?: boolean
  hidePreview?: boolean
}

export const DailyItemCell = forwardRef(
  (
    { item, tags = [], section, onClick, selected, hideDate = false, hidePreview = false, hideTags = false }: Props,
    ref: Ref<HTMLDivElement>,
  ) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`content-list-item flex w-full cursor-pointer items-stretch text-text ${
          selected && 'selected border-l-2 border-solid border-danger'
        }`}
        id={section.id}
      >
        <div className="min-w-0 flex-grow border-b border-solid border-border px-4 py-4">
          <div className="flex items-start overflow-hidden text-base">
            <DaySquare weekday={section.weekday} hasActivity={item != undefined} day={section.day} />

            <div className="w-full leading-[1.3]">
              {item && (
                <>
                  <ListItemTitle item={item} />
                  {isNote(item) && <ListItemNotePreviewText hidePreview={hidePreview} item={item} lineLimit={5} />}
                  <ListItemMetadata item={item} hideDate={hideDate} sortBy={'created_at'} />
                  <ListItemTags hideTags={hideTags} tags={tags} />
                </>
              )}
              {!item && (
                <div className="w-full">
                  <div className="break-word mr-2 font-semibold">{formatDateAndTimeForNote(section.date, false)}</div>
                  <EmptyPlaceholderBars rows={1} />
                </div>
              )}
            </div>
          </div>
        </div>
        {item && <ListItemFlagIcons item={item} hasFiles={false} />}
      </div>
    )
  },
)
