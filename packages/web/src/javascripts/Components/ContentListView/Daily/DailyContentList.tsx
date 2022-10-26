import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { ListableContentItem } from '../Types/ListableContentItem'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { ElementIds } from '@/Constants/ElementIDs'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { WebApplication } from '@/Application/Application'
import { useResponsiveAppPane } from '../../ResponsivePane/ResponsivePaneProvider'
import { AppPaneId } from '../../ResponsivePane/AppPaneMetadata'
import { createDailySectionsWithTemplateInterstices } from './CreateDailySections'
import { DailyNotesBlankItemsToInsertAtFrontAndEnd } from './Constants'
import { DailyItemsDaySection } from './DailyItemsDaySection'
import { CalendarCell } from './CalendarCell'
import { SNTag } from '@standardnotes/snjs'

type Props = {
  application: WebApplication
  itemListController: ItemListController
  items: ListableContentItem[]
  selectionController: SelectedItemsController
  selectedTag: SNTag
  selectedUuids: SelectedItemsController['selectedUuids']
}

const DailyContentList: FunctionComponent<Props> = ({
  application,
  items,
  itemListController,
  selectionController,
  selectedUuids,
  selectedTag,
}) => {
  const [selectedTemplateItem, setSelectedTemplateItem] = useState<DailyItemsDaySection>()

  const { toggleAppPane } = useResponsiveAppPane()

  const [needsSelectionReload, setNeedsSelectionReload] = useState(false)

  const sectionedItems = useMemo(
    () => createDailySectionsWithTemplateInterstices(items, DailyNotesBlankItemsToInsertAtFrontAndEnd),
    [items],
  )

  const todaySection = useMemo(
    () => sectionedItems.find((item) => item.isToday) as DailyItemsDaySection,
    [sectionedItems],
  )

  useEffect(() => {
    const needsUpdateSelectedInstance = selectedTemplateItem
    if (needsUpdateSelectedInstance) {
      setSelectedTemplateItem(sectionedItems.find((candidate) => candidate.id === selectedTemplateItem.id))
    }

    if (needsSelectionReload) {
      setNeedsSelectionReload(false)

      if (todaySection.items) {
        onClickItem(todaySection.items[0])
      } else {
        onClickTemplate(todaySection)
        const itemElement = document.getElementById(todaySection.id)
        itemElement?.scrollIntoView({ behavior: 'auto' })
      }
    }
  }, [sectionedItems, needsSelectionReload])

  useEffect(() => {
    if (!todaySection) {
      throw new Error('todaySection should not be undefined')
    }

    setNeedsSelectionReload(true)
  }, [selectedTag.uuid])

  const onClickItem = useCallback(async (item: ListableContentItem) => {
    await selectionController.selectItemWithScrollHandling(item, {
      userTriggered: true,
      scrollIntoView: true,
      animated: false,
    })

    toggleAppPane(AppPaneId.Editor)
    setSelectedTemplateItem(undefined)
  }, [])

  const onClickTemplate = useCallback(
    (section: DailyItemsDaySection) => {
      setSelectedTemplateItem(section)
      itemListController.createNewNote(undefined, section.date, 'editor')
    },
    [setSelectedTemplateItem, itemListController],
  )

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
              section={section}
              key={item.uuid}
              item={item}
              tags={application.getItemTags(item)}
              onClick={() => onClickItem(item)}
            />
          ))
        } else {
          return (
            <CalendarCell
              selected={section.id === selectedTemplateItem?.id}
              section={section}
              key={section.dateKey}
              onClick={() => onClickTemplate(section)}
            />
          )
        }
      })}
    </div>
  )
}

export default observer(DailyContentList)
