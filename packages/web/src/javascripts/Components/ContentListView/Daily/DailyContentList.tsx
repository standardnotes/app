import { FunctionComponent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { ListableContentItem } from '../Types/ListableContentItem'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { ElementIds } from '@/Constants/ElementIDs'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { useResponsiveAppPane } from '../../ResponsivePane/ResponsivePaneProvider'
import { AppPaneId } from '../../ResponsivePane/AppPaneMetadata'
import {
  createDailyItemsWithToday,
  createItemsByDateMapping,
  insertBlanks,
  templateEntryForDate,
} from './CreateDailySections'
import { DailyItemsDay } from './DailyItemsDaySection'
import { DailyItemCell } from './DailyItemCell'
import { SNTag } from '@standardnotes/snjs'
import { CalendarActivity } from '../Calendar/CalendarActivity'
import { dateToDailyDayIdentifier } from './Utils'
import CalendarScroller from '../Calendar/CalendarScroller'

type Props = {
  itemListController: ItemListController
  items: ListableContentItem[]
  onSelect: (item: ListableContentItem, userTriggered: boolean) => Promise<void>
  selectedTag: SNTag
  selectedUuids: SelectedItemsController['selectedUuids']
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
  const [dailyItems, setDailyItems] = useState<DailyItemsDay[]>(() => {
    return createDailyItemsWithToday(PageSize)
  })
  const [todayItem, setTodayItem] = useState<DailyItemsDay>()
  const [lastVisibleSection, setLastVisibleSection] = useState<DailyItemsDay>()
  const [selectedEmptyDay, setSelectedEmptyDay] = useState<DailyItemsDay>()
  const { hideTags, hideDate, hideNotePreview } = itemListController.webDisplayOptions
  const [lastElement, setLastElement] = useState<HTMLDivElement | null>(null)
  const [firstElement, setFirstElement] = useState<HTMLDivElement | null>(null)
  const [lastScrollHeight, setLastScrollHeight] = useState(0)
  const [didPaginateTop, setDidPaginateTop] = useState(false)
  const scrollArea = useRef<HTMLDivElement>(null)

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
    const copy = dailyItems.slice()
    insertBlanks(copy, 'end', PageSize)
    setDailyItems(copy)
  }, [dailyItems, setDailyItems])

  const paginateTop = useCallback(() => {
    if (scrollArea.current) {
      setLastScrollHeight(scrollArea.current.scrollHeight)
    }
    const copy = dailyItems.slice()
    insertBlanks(copy, 'front', PageSize)
    setDidPaginateTop(true)
    setDailyItems(copy)
  }, [dailyItems, setDailyItems, setDidPaginateTop])

  useLayoutEffect(() => {
    if (!scrollArea.current) {
      return
    }

    if (didPaginateTop) {
      scrollArea.current.scrollTop += scrollArea.current.scrollHeight - lastScrollHeight
      setDidPaginateTop(false)
    }
  }, [didPaginateTop, lastScrollHeight])

  const onListItemDidBecomeVisible = useCallback(
    (elementId: string) => {
      const section = dailyItems.find((candidate) => candidate.id === elementId)
      setLastVisibleSection(section)
    },
    [setLastVisibleSection, dailyItems],
  )

  const visibilityObserver = useMemo(
    () =>
      new IntersectionObserver(
        (entries) => {
          const visibleEntry = entries.find((entry) => entry.isIntersecting)
          if (visibleEntry) {
            onListItemDidBecomeVisible(visibleEntry.target.id)
          }
        },
        { threshold: 0.9 },
      ),
    [onListItemDidBecomeVisible],
  )

  const bottomObserver = useMemo(
    () =>
      new IntersectionObserver(
        (entries) => {
          const first = entries[0]
          if (first.isIntersecting) {
            paginateBottom()
          }
        },
        { threshold: 0.5 },
      ),
    [paginateBottom],
  )

  const topObserver = useMemo(
    () =>
      new IntersectionObserver(
        (entries) => {
          const first = entries[0]
          if (first.isIntersecting) {
            paginateTop()
          }
        },
        { threshold: 0.5 },
      ),
    [paginateTop],
  )

  useEffect(() => {
    if (lastElement) {
      bottomObserver.observe(lastElement)
    }

    return () => {
      if (lastElement) {
        bottomObserver.unobserve(lastElement)
      }
    }
  }, [lastElement, bottomObserver])

  useEffect(() => {
    if (firstElement) {
      topObserver.observe(firstElement)
    }

    return () => {
      if (firstElement) {
        topObserver.unobserve(firstElement)
      }
    }
  }, [firstElement, topObserver])

  const onClickItem = useCallback(
    async (item: ListableContentItem, userTriggered: boolean) => {
      await onSelect(item, userTriggered)

      toggleAppPane(AppPaneId.Editor)
      setSelectedEmptyDay(undefined)
    },
    [onSelect, toggleAppPane],
  )

  const onClickTemplate = useCallback(
    (section: DailyItemsDay) => {
      setSelectedEmptyDay(section)
      itemListController.createNewNote(undefined, section.date, 'editor')
      toggleAppPane(AppPaneId.Editor)
    },
    [setSelectedEmptyDay, itemListController, toggleAppPane],
  )

  useEffect(() => {
    if (selectedEmptyDay) {
      const updatedInstance = dailyItems.find((candidate) => candidate.id === selectedEmptyDay.id)
      if (updatedInstance) {
        setSelectedEmptyDay(updatedInstance)
      }
    }
  }, [dailyItems])

  useEffect(() => {
    if (needsSelectionReload) {
      setNeedsSelectionReload(false)

      if (!todayItem) {
        return
      }

      const items = itemsByDateMapping[todayItem.id]
      if (items?.length > 0) {
        void onClickItem(items[0], false)
      } else {
        onClickTemplate(todayItem)
        const itemElement = document.getElementById(todayItem.id)
        itemElement?.scrollIntoView({ behavior: 'auto' })
      }
    }
  }, [needsSelectionReload, onClickItem, onClickTemplate, todayItem])

  useEffect(() => {
    setNeedsSelectionReload(true)
  }, [selectedTag.uuid])

  const onCalendarSelect = useCallback(
    (date: Date) => {
      setLastVisibleSection(undefined)

      const dailyItemForDate = (date: Date): DailyItemsDay | undefined => {
        return dailyItems.find((candidate) => dateToDailyDayIdentifier(date) === candidate.dateKey)
      }

      const dailyItem = dailyItemForDate(date)
      if (dailyItem) {
        const items = itemsByDateMapping[dailyItem.id]
        if (items.length > 0) {
          void onClickItem(items[0], false)
        } else if (dailyItem) {
          void onClickTemplate(dailyItem)
        }
      } else {
        const newDailyItem = templateEntryForDate(date)
        const copy = dailyItems.slice()
        copy.unshift(newDailyItem)
        setDailyItems(copy)
        void onClickTemplate(newDailyItem)
      }
    },
    [onClickItem, setLastVisibleSection, setDailyItems, onClickTemplate, dailyItems],
  )

  return (
    <>
      <CalendarScroller
        currentListDate={lastVisibleSection?.date}
        activities={calendarActivities}
        activityType={'created'}
        onDateSelect={onCalendarSelect}
        selectedTemplateDay={selectedEmptyDay?.date}
      />
      <div
        className={classNames(
          'infinite-scroll overflow-y-auto overflow-x-hidden focus:shadow-none focus:outline-none',
          'md:max-h-full md:overflow-y-hidden md:hover:overflow-y-auto pointer-coarse:md:overflow-y-auto',
          'md:hover:[overflow-y:_overlay]',
        )}
        ref={scrollArea}
        id={ElementIds.ContentList}
        tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      >
        {dailyItems.map((dailyItem, index) => {
          const isFirst = index === 0
          const isLast = index === dailyItems.length - 1
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
                onClick={() => onClickItem(item, true)}
                ref={(ref) => {
                  isLast ? setLastElement(ref) : isFirst ? setFirstElement(ref) : null
                  if (ref) {
                    visibilityObserver.observe(ref)
                  }
                }}
              />
            ))
          } else {
            return (
              <DailyItemCell
                selected={dailyItem.id === selectedEmptyDay?.id}
                section={dailyItem}
                id={dailyItem.id}
                key={dailyItem.dateKey}
                onClick={() => onClickTemplate(dailyItem)}
                ref={(ref) => {
                  isLast ? setLastElement(ref) : isFirst ? setFirstElement(ref) : null
                  if (ref) {
                    visibilityObserver.observe(ref)
                  }
                }}
              />
            )
          }
        })}
      </div>
    </>
  )
}

export default DailyContentList
