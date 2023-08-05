import { FunctionComponent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ListableContentItem } from '../Types/ListableContentItem'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { useResponsiveAppPane } from '../../Panes/ResponsivePaneProvider'
import { AppPaneId } from '../../Panes/AppPaneMetadata'
import {
  createDailyItemsWithToday,
  createItemsByDateMapping,
  insertBlanks,
  templateEntryForDate,
} from './CreateDailySections'
import { DailyItemsDay } from './DailyItemsDaySection'
import { DailyItemCell } from './DailyItemCell'
import { SNTag, pluralize } from '@standardnotes/snjs'
import { CalendarActivity } from '../Calendar/CalendarActivity'
import { dateToDailyDayIdentifier, getDailyWritingStreak } from './Utils'
import InfiniteCalendar, { InfiniteCalendarInterface } from '../Calendar/InfiniteCalendar'
import { InfiniteScrollerInterface, InfinteScroller } from '../InfiniteScroller/InfiniteScroller'
import { LoggingDomain, log } from '@/Logging'
import { isMobileScreen } from '@/Utils'

type Props = {
  itemListController: ItemListController
  items: ListableContentItem[]
  onSelect: (item: ListableContentItem, userTriggered: boolean) => Promise<void>
  selectedTag: SNTag
  selectedUuids: ItemListController['selectedUuids']
}

const PageSize = 10

const DailyContentList: FunctionComponent<Props> = ({
  items,
  itemListController,
  onSelect,
  selectedUuids,
  selectedTag,
}) => {
  const { toggleAppPane } = useResponsiveAppPane()
  const [needsSelectionReload, setNeedsSelectionReload] = useState(false)
  const [todayItem, setTodayItem] = useState<DailyItemsDay>()
  const [selectedDay, setSelectedDay] = useState<Date>()
  const calendarRef = useRef<InfiniteCalendarInterface | null>(null)
  const [lastVisibleDay, setLastVisibleDay] = useState<DailyItemsDay>()
  const scrollerRef = useRef<InfiniteScrollerInterface | null>(null)

  const [dailyItems, setDailyItems] = useState<DailyItemsDay[]>(() => {
    return createDailyItemsWithToday(PageSize)
  })

  const { hideTags, hideDate, hideNotePreview } = itemListController.webDisplayOptions

  const itemsByDateMapping = useMemo(() => {
    return createItemsByDateMapping(items)
  }, [items])

  const currentStreak = useMemo(
    () => getDailyWritingStreak(todayItem, itemsByDateMapping),
    [todayItem, itemsByDateMapping],
  )

  useEffect(() => {
    setTodayItem(dailyItems.find((item) => item.isToday) as DailyItemsDay)
  }, [dailyItems])

  useLayoutEffect(() => {
    if (todayItem && scrollerRef.current) {
      scrollerRef.current?.scrollToElementId(todayItem.id)
    }
  }, [todayItem, scrollerRef])

  const calendarActivities: CalendarActivity[] = useMemo(() => {
    return items.map((item) => {
      return {
        date: item.created_at,
        item: item,
      }
    })
  }, [items])

  const paginateBottom = useCallback(() => {
    log(LoggingDomain.DailyNotes, '[ContentList] paginateBottom')
    setDailyItems((prev) => {
      const copy = prev.slice()
      insertBlanks(copy, 'end', PageSize)
      return copy
    })
  }, [setDailyItems])

  const paginateTop = useCallback(() => {
    log(LoggingDomain.DailyNotes, '[ContentList] paginateTop')
    setDailyItems((prev) => {
      const copy = prev.slice()
      insertBlanks(copy, 'front', PageSize)
      return copy
    })
  }, [setDailyItems])

  const onListItemDidBecomeVisible = useCallback(
    (elementId: string) => {
      const dailyItem = dailyItems.find((candidate) => candidate.id === elementId)
      if (dailyItem && dailyItem !== lastVisibleDay) {
        setLastVisibleDay(dailyItem)
        log(LoggingDomain.DailyNotes, '[ContentList] Item did become visible for date', dailyItem.date)
        calendarRef?.current?.goToMonth(dailyItem.date)
      } else {
        log(LoggingDomain.DailyNotes, '[ContentList] Ignoring duplicate day visibility')
      }
    },
    [dailyItems, lastVisibleDay],
  )

  const onClickItem = useCallback(
    async (day: DailyItemsDay, item: ListableContentItem, userTriggered: boolean) => {
      await onSelect(item, userTriggered)
      toggleAppPane(AppPaneId.Editor)
      setSelectedDay(day.date)
    },
    [onSelect, toggleAppPane],
  )

  const onClickTemplate = useCallback(
    (date: Date) => {
      setSelectedDay(date)
      void itemListController.createNewNote(undefined, date, 'editor')
      toggleAppPane(AppPaneId.Editor)
    },
    [setSelectedDay, itemListController, toggleAppPane],
  )

  const dailyItemForDate = useCallback(
    (date: Date): DailyItemsDay | undefined => {
      return dailyItems.find((candidate) => dateToDailyDayIdentifier(date) === candidate.dateKey)
    },
    [dailyItems],
  )

  useEffect(() => {
    if (needsSelectionReload) {
      setNeedsSelectionReload(false)

      if (!todayItem) {
        return
      }

      const items = itemsByDateMapping[todayItem.id]
      if (items?.length > 0) {
        const item = items[0]
        const dailyItem = dailyItemForDate(item.created_at)
        if (dailyItem) {
          void onClickItem(dailyItem, items[0], false)
        }
      } else {
        onClickTemplate(todayItem.date)
        const itemElement = document.getElementById(todayItem.id)
        itemElement?.scrollIntoView({ behavior: 'auto' })
      }
    }
  }, [needsSelectionReload, onClickItem, onClickTemplate, todayItem, dailyItemForDate, itemsByDateMapping])

  useEffect(() => {
    setNeedsSelectionReload(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTag.uuid])

  const onCalendarSelect = useCallback(
    (date: Date) => {
      const dailyItem = templateEntryForDate(date)
      const items = itemsByDateMapping[dailyItem.id]
      if (items?.length > 0) {
        void onClickItem(dailyItem, items[0], false)
      } else if (dailyItem) {
        void onClickTemplate(dailyItem.date)
      }
    },
    [onClickItem, onClickTemplate, itemsByDateMapping],
  )

  const hasItemsOnSelectedDay = selectedDay && itemsByDateMapping[dateToDailyDayIdentifier(selectedDay)]?.length > 0
  return (
    <>
      <InfiniteCalendar
        activities={calendarActivities}
        activityType={'created'}
        onDateSelect={onCalendarSelect}
        selectedDay={selectedDay}
        selectedDayType={!selectedDay ? undefined : hasItemsOnSelectedDay ? 'item' : 'template'}
        ref={calendarRef}
        className={'flex-column flex'}
      >
        {currentStreak > 0 && (
          <div className="flex w-full items-center justify-center border-t border-solid border-border bg-secondary-background p-2">
            <span className="opacity-50">Current Streak</span>
            <span className="ml-1.5 font-bold">
              {currentStreak} {pluralize(currentStreak, 'Day', 'Days')}
            </span>
          </div>
        )}
      </InfiniteCalendar>

      <InfinteScroller
        paginateFront={paginateTop}
        paginateEnd={paginateBottom}
        direction="vertical"
        onElementVisibility={onListItemDidBecomeVisible}
        className={'flex-1'}
        ref={scrollerRef}
        isMobileScreen={isMobileScreen()}
      >
        {dailyItems.map((dailyItem) => {
          const items = itemsByDateMapping[dailyItem.id]
          if (items) {
            return items.map((item) => (
              <DailyItemCell
                selected={selectedUuids.has(item.uuid)}
                section={dailyItem}
                key={item.uuid}
                id={dailyItem.id}
                item={item}
                hideDate={hideDate}
                hidePreview={hideNotePreview}
                hideTags={hideTags}
                onClick={() => onClickItem(dailyItem, item, true)}
              />
            ))
          } else {
            return (
              <DailyItemCell
                selected={selectedDay && dailyItem.id === dateToDailyDayIdentifier(selectedDay)}
                section={dailyItem}
                id={dailyItem.id}
                key={dailyItem.dateKey}
                onClick={() => onClickTemplate(dailyItem.date)}
              />
            )
          }
        })}
      </InfinteScroller>
    </>
  )
}

export default DailyContentList
