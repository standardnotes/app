import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { ListableContentItem } from '../Types/ListableContentItem'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { ElementIds } from '@/Constants/ElementIDs'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { useResponsiveAppPane } from '../../ResponsivePane/ResponsivePaneProvider'
import { AppPaneId } from '../../ResponsivePane/AppPaneMetadata'
import { createDailySectionsWithTemplateInterstices, insertBlanks, templateEntryForDate } from './CreateDailySections'
import { DailyItemsDaySection } from './DailyItemsDaySection'
import { DailyItemCell } from './DailyItemCell'
import { SNTag } from '@standardnotes/snjs'
import { CalendarActivity } from '../Calendar/CalendarActivity'
import { dailiesDateToSectionTitle } from './Utils'
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
  const [sectionedItems, setSectionedItems] = useState<DailyItemsDaySection[]>([])
  const [todaySection, setTodaySection] = useState<DailyItemsDaySection>()
  const [selectedTemplateItem, setSelectedTemplateItem] = useState<DailyItemsDaySection>()
  const { hideTags, hideDate, hideNotePreview } = itemListController.webDisplayOptions
  const [lastElement, setLastElement] = useState<HTMLDivElement | null>(null)
  const [firstElement, setFirstElement] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    const result = createDailySectionsWithTemplateInterstices(items)
    if (result.length < PageSize) {
      insertBlanks(result, 'front', PageSize)
      insertBlanks(result, 'end', PageSize)
    } else {
      insertBlanks(result, 'front', PageSize)
    }
    setSectionedItems(result)
    setTodaySection(result.find((item) => item.isToday) as DailyItemsDaySection)
  }, [items])

  const calendarActivities: CalendarActivity[] = useMemo(() => {
    return items.map((item) => {
      return {
        date: item.created_at,
        item: item,
      }
    })
  }, [items])

  const paginateBottom = useCallback(() => {
    const copy = sectionedItems.slice()
    insertBlanks(copy, 'end', PageSize)
    setSectionedItems(copy)
  }, [sectionedItems, setSectionedItems])

  const paginateTop = useCallback(() => {
    const copy = sectionedItems.slice()
    insertBlanks(copy, 'front', PageSize)
    setSectionedItems(copy)
  }, [sectionedItems, setSectionedItems])

  const bottomObserver = useMemo(
    () =>
      new IntersectionObserver((entries) => {
        const first = entries[0]
        if (first.isIntersecting) {
          paginateBottom()
        }
      }),
    [paginateBottom],
  )

  const topObserver = useMemo(
    () =>
      new IntersectionObserver((entries) => {
        const first = entries[0]
        if (first.isIntersecting) {
          paginateTop()
        }
      }),
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
      setSelectedTemplateItem(undefined)
    },
    [onSelect, toggleAppPane],
  )

  const onClickTemplate = useCallback(
    (section: DailyItemsDaySection) => {
      setSelectedTemplateItem(section)
      itemListController.createNewNote(undefined, section.date, 'editor')
      toggleAppPane(AppPaneId.Editor)
    },
    [setSelectedTemplateItem, itemListController, toggleAppPane],
  )

  useEffect(() => {
    const needsUpdateSelectedInstance = selectedTemplateItem
    if (needsUpdateSelectedInstance) {
      setSelectedTemplateItem(sectionedItems.find((candidate) => candidate.id === selectedTemplateItem.id))
    }

    if (needsSelectionReload) {
      setNeedsSelectionReload(false)

      if (!todaySection) {
        return
      }

      if (todaySection.items) {
        void onClickItem(todaySection.items[0], false)
      } else {
        onClickTemplate(todaySection)
        const itemElement = document.getElementById(todaySection.id)
        itemElement?.scrollIntoView({ behavior: 'auto' })
      }
    }
  }, [sectionedItems, needsSelectionReload, onClickItem, onClickTemplate, selectedTemplateItem, todaySection])

  useEffect(() => {
    setNeedsSelectionReload(true)
  }, [selectedTag.uuid])

  const onCalendarSelect = useCallback(
    (date: Date) => {
      const sectionForDate = (date: Date): DailyItemsDaySection | undefined => {
        return sectionedItems.find((candidate) => dailiesDateToSectionTitle(date) === candidate.dateKey)
      }
      const section = sectionForDate(date)
      if (section?.items && section?.items?.length > 0) {
        void onClickItem(section.items[0], false)
      } else if (section) {
        void onClickTemplate(section)
      } else {
        const newSection = templateEntryForDate(date)
        const copy = sectionedItems.slice()
        copy.unshift(newSection)
        setSectionedItems(copy)
        void onClickTemplate(newSection)
      }
    },
    [onClickItem, setSectionedItems, onClickTemplate, sectionedItems],
  )

  return (
    <>
      <CalendarScroller activities={calendarActivities} activityType={'created'} onDateSelect={onCalendarSelect} />
      <div
        className={classNames(
          'infinite-scroll overflow-y-auto overflow-x-hidden focus:shadow-none focus:outline-none',
          'md:max-h-full md:overflow-y-hidden md:hover:overflow-y-auto pointer-coarse:md:overflow-y-auto',
          'md:hover:[overflow-y:_overlay]',
        )}
        id={ElementIds.ContentList}
        tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      >
        {sectionedItems.map((section, index) => {
          const isFirst = index === 0
          const isLast = index === sectionedItems.length - 1
          if (section.items) {
            return section.items.map((item) => (
              <DailyItemCell
                selected={selectedUuids.has(item.uuid)}
                section={section}
                key={item.uuid}
                item={item}
                hideDate={hideDate}
                hidePreview={hideNotePreview}
                hideTags={hideTags}
                onClick={() => onClickItem(item, true)}
                ref={isLast ? setLastElement : isFirst ? setFirstElement : null}
              />
            ))
          } else {
            return (
              <DailyItemCell
                selected={section.id === selectedTemplateItem?.id}
                section={section}
                key={section.dateKey}
                onClick={() => onClickTemplate(section)}
                ref={isLast ? setLastElement : isFirst ? setFirstElement : null}
              />
            )
          }
        })}
      </div>
    </>
  )
}

export default observer(DailyContentList)
