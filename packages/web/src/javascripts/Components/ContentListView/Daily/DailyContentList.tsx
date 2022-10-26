import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useMemo } from 'react'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { ListableContentItem } from '../Types/ListableContentItem'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { ElementIds } from '@/Constants/ElementIDs'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { formatDateAndTimeForNote } from '@/Utils/DateUtils'
import { WebApplication } from '@/Application/Application'
import { useResponsiveAppPane } from '../../ResponsivePane/ResponsivePaneProvider'
import { AppPaneId } from '../../ResponsivePane/AppPaneMetadata'
import { createDailySectionsWithTemplateInterstices } from './CreateDailySections'
import { DailyNotesBlankItemsToInsertAtFrontAndEnd } from './Constants'
import { DailyItemsDaySection } from './DailyItemsDaySection'
import { CalendarCell } from './CalendarCell'

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

export default observer(DailyContentList)
