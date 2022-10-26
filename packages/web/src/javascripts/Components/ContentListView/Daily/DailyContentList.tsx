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
import { createDailySectionsWithTemplateInterstices } from './CreateDailySections'
import { DailyNotesBlankItemsToInsertAtFrontAndEnd } from './Constants'
import { DailyItemsDaySection } from './DailyItemsDaySection'
import { CalendarCell } from './CalendarCell'
import { SNTag } from '@standardnotes/snjs'

type Props = {
  itemListController: ItemListController
  items: ListableContentItem[]
  onSelect: (item: ListableContentItem, userTriggered: boolean) => Promise<void>
  selectedTag: SNTag
  selectedUuids: SelectedItemsController['selectedUuids']
}

const DailyContentList: FunctionComponent<Props> = ({
  items,
  itemListController,
  onSelect,
  selectedUuids,
  selectedTag,
}) => {
  const [selectedTemplateItem, setSelectedTemplateItem] = useState<DailyItemsDaySection>()
  const { hideTags, hideDate, hideNotePreview } = itemListController.webDisplayOptions

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
    },
    [setSelectedTemplateItem, itemListController],
  )

  useEffect(() => {
    const needsUpdateSelectedInstance = selectedTemplateItem
    if (needsUpdateSelectedInstance) {
      setSelectedTemplateItem(sectionedItems.find((candidate) => candidate.id === selectedTemplateItem.id))
    }

    if (needsSelectionReload) {
      setNeedsSelectionReload(false)

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
              hideDate={hideDate}
              hidePreview={hideNotePreview}
              hideTags={hideTags}
              onClick={() => onClickItem(item, true)}
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
