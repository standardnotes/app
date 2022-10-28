import { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ListableContentItem } from '../Types/ListableContentItem'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { useResponsiveAppPane } from '../../ResponsivePane/ResponsivePaneProvider'
import { AppPaneId } from '../../ResponsivePane/AppPaneMetadata'
import { createDailyItemsWithToday, createItemsByDateMapping, insertBlanks } from './CreateDailySections'
import { DailyItemsDay } from './DailyItemsDaySection'
import { DailyItemCell } from './DailyItemCell'
import { SNTag } from '@standardnotes/snjs'
import { CalendarActivity } from '../Calendar/CalendarActivity'
import { dateToDailyDayIdentifier } from './Utils'
import InfiniteCalendar, { InfiniteCalendarInterface } from '../Calendar/InfiniteCalendar'
import { InfinteScroller } from '../InfiniteScroller/InfiniteScroller'

type Props = {
  itemListController: ItemListController
  items: ListableContentItem[]
  onSelect: (item: ListableContentItem, userTriggered: boolean) => Promise<void>
  selectedTag: SNTag
  selectedUuids: SelectedItemsController['selectedUuids']
}

const PageSize = 10
const LoggingEnabled = true

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

  const [dailyItems, setDailyItems] = useState<DailyItemsDay[]>(() => {
    return createDailyItemsWithToday(PageSize)
  })

  const { hideTags, hideDate, hideNotePreview } = itemListController.webDisplayOptions

  const itemsByDateMapping = useMemo(() => {
    return createItemsByDateMapping(items)
  }, [items])

  useEffect(() => {
    setTodayItem(dailyItems.find((item) => item.isToday) as DailyItemsDay)
  }, [dailyItems])

  const calendarActivities: CalendarActivity[] = useMemo(() => {
    return items.map((item) => {
      return {
        date: item.created_at,
        item: item,
      }
    })
  }, [items])

  const paginateBottom = useCallback(() => {
    setDailyItems((prev) => {
      const copy = prev.slice()
      insertBlanks(copy, 'end', PageSize)
      return copy
    })
  }, [setDailyItems])

  const paginateTop = useCallback(() => {
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
        LoggingEnabled && console.log('[ContentList] Item did become visible for date', dailyItem.date)
        calendarRef?.current?.goToMonth(dailyItem.date)
      } else {
        LoggingEnabled && console.log('[ContentList] Ignoring duplicate day visibility')
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
      itemListController.createNewNote(undefined, date, 'editor')
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
      const dailyItem = dailyItemForDate(date)
      if (dailyItem) {
        const items = itemsByDateMapping[dailyItem.id]
        if (items?.length > 0) {
          void onClickItem(dailyItem, items[0], false)
        } else if (dailyItem) {
          void onClickTemplate(dailyItem.date)
        }
      } else {
        void onClickTemplate(date)
      }
    },
    [onClickItem, onClickTemplate, dailyItemForDate, itemsByDateMapping],
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
      />

      <InfinteScroller
        paginateFront={paginateTop}
        paginateEnd={paginateBottom}
        direction="vertical"
        onElementVisibility={onListItemDidBecomeVisible}
        className={'flex-1'}
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
