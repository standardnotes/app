import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useMemo } from 'react'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { ListableContentItem } from '../Types/ListableContentItem'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { ElementIds } from '@/Constants/ElementIDs'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { formatDateAndTimeForNote } from '@/Utils/DateUtils'
import { SNTag } from '@standardnotes/snjs'
import ListItemMetadata from '../ListItemMetadata'
import ListItemTags from '../ListItemTags'
import { WebApplication } from '@/Application/Application'
import { useResponsiveAppPane } from '../../ResponsivePane/ResponsivePaneProvider'
import { AppPaneId } from '../../ResponsivePane/AppPaneMetadata'
import { createDailySectionsWithTemplateInterstices } from './CreateDailySections'
import { DailyNotesBlankItemsToInsertAtFrontAndEnd } from './Constants'
import NotePreviewText from '../NotePreviewText'
import { DailyItemsDaySection } from './DailyItemsDaySection'

type Props = {
  application: WebApplication
  itemListController: ItemListController
  items: ListableContentItem[]
  selectionController: SelectedItemsController
  selectedUuids: SelectedItemsController['selectedUuids']
}

const DailyContentList: FunctionComponent<Props> = ({
  application,
  items,
  itemListController,
  selectionController,
  selectedUuids,
}) => {
  const { toggleAppPane } = useResponsiveAppPane()

  const sectionedItems = useMemo(
    () => createDailySectionsWithTemplateInterstices(items, DailyNotesBlankItemsToInsertAtFrontAndEnd),
    [items],
  )

  const onClickItem = useCallback(async (item: ListableContentItem) => {
    await selectionController.selectItemWithScrollHandling(item, {
      userTriggered: true,
      scrollIntoView: true,
      animated: false,
    })

    toggleAppPane(AppPaneId.Editor)
  }, [])

  const onClickTemplate = useCallback((date: Date, title?: string) => {
    itemListController.createNewNote(title, date, 'editor')
  }, [])

  const todayItem = sectionedItems.find((item) => item.isToday) as DailyItemsDaySection
  useEffect(() => {
    if (todayItem?.items) {
      onClickItem(todayItem.items[0])
    } else {
      onClickTemplate(todayItem?.date, undefined)
    }
  }, [])

  return (
    <div
      className={classNames(
        'infinite-scroll overflow-y-auto overflow-x-hidden focus:shadow-none focus:outline-none',
        'md:max-h-full md:overflow-y-hidden md:hover:overflow-y-auto pointer-coarse:md:overflow-y-auto',
        'md:hover:[overflow-y:_overlay]',
      )}
      id={ElementIds.ContentList}
      tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
    >
      {sectionedItems.map((section) => {
        if (section.items) {
          return section.items.map((item) => (
            <CalendarCell
              selected={selectedUuids.has(item.uuid)}
              key={Math.random()}
              item={item}
              day={section.day}
              date={section.date}
              title={section.dateKey}
              tags={application.getItemTags(item)}
              onClick={() => onClickItem(item)}
            />
          ))
        } else {
          return (
            <CalendarCell
              key={Math.random()}
              day={section.day}
              date={section.date}
              title={formatDateAndTimeForNote(section.date, false)}
              onClick={() => onClickTemplate(section.date, formatDateAndTimeForNote(section.date, false))}
            />
          )
        }
      })}
    </div>
  )
}

type CalendarCellProps = {
  item?: ListableContentItem
  date: Date
  title: string
  day: number
  onClick: () => void
  tags?: SNTag[]
  selected?: boolean
}

const CalendarCell: FunctionComponent<CalendarCellProps> = ({
  item,
  tags = [],
  title,
  day,
  onClick,
  selected,
}: CalendarCellProps) => {
  return (
    <div
      onClick={onClick}
      className={`content-list-item flex w-full cursor-pointer items-stretch text-text ${
        selected && 'selected border-l-2 border-solid border-info'
      }`}
      id={item?.uuid || title}
      key={Math.random()}
    >
      <div className="min-w-0 flex-grow border-b border-solid border-border py-4 px-4">
        <div className="flex items-start overflow-hidden text-base">
          <div
            className={`${
              item ? 'bg-danger text-danger-contrast' : 'bg-neutral text-neutral-contrast'
            } mr-3 h-7 w-7 rounded  p-1 text-center text-sm font-bold `}
          >
            {day}
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
                <div className="break-word mr-2 font-semibold">{title}</div>
                <div className="leading-1.3 line-clamp-1 mt-1 overflow-hidden text-sm">No notes yet</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default observer(DailyContentList)
