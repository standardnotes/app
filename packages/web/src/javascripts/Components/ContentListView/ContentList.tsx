import { WebApplication } from '@/Application/Application'
import { KeyboardKey } from '@standardnotes/ui-services'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, KeyboardEventHandler, UIEventHandler, useCallback } from 'react'
import { FOCUSABLE_BUT_NOT_TABBABLE, NOTES_LIST_SCROLL_THRESHOLD } from '@/Constants/Constants'
import { ListableContentItem } from './Types/ListableContentItem'
import ContentListItem from './ContentListItem'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { FilesController } from '@/Controllers/FilesController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import { ElementIds } from '@/Constants/ElementIDs'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { ContentType, SNTag } from '@standardnotes/snjs'

type Props = {
  application: WebApplication
  filesController: FilesController
  itemListController: ItemListController
  items: ListableContentItem[]
  navigationController: NavigationController
  notesController: NotesController
  selectionController: SelectedItemsController
  selectedUuids: SelectedItemsController['selectedUuids']
  paginate: () => void
}

const ContentList: FunctionComponent<Props> = ({
  application,
  filesController,
  itemListController,
  items,
  navigationController,
  notesController,
  selectionController,
  selectedUuids,
  paginate,
}) => {
  const { selectPreviousItem, selectNextItem } = selectionController
  const { hideTags, hideDate, hideNotePreview, hideEditorIcon } = itemListController.webDisplayOptions
  const { sortBy } = itemListController.displayOptions
  const selectedTag = navigationController.selected

  const onScroll: UIEventHandler = useCallback(
    (e) => {
      const offset = NOTES_LIST_SCROLL_THRESHOLD
      const element = e.target as HTMLElement
      if (element.scrollTop + element.offsetHeight >= element.scrollHeight - offset) {
        paginate()
      }
    },
    [paginate],
  )

  const onKeyDown: KeyboardEventHandler = useCallback(
    (e) => {
      if (e.key === KeyboardKey.Up) {
        e.preventDefault()
        selectPreviousItem()
      } else if (e.key === KeyboardKey.Down) {
        e.preventDefault()
        selectNextItem()
      }
    },
    [selectNextItem, selectPreviousItem],
  )

  const selectItem = useCallback(
    (item: ListableContentItem, userTriggered?: boolean) => {
      return selectionController.selectItem(item.uuid, userTriggered)
    },
    [selectionController],
  )

  const getTagsForItem = useCallback(
    (item: ListableContentItem) => {
      if (hideTags) {
        return []
      }

      if (!selectedTag) {
        return []
      }

      const tags = application.getItemTags(item)

      const isNavigatingOnlyTag = selectedTag instanceof SNTag && tags.length === 1
      if (isNavigatingOnlyTag) {
        return []
      }

      return tags
    },
    [hideTags, selectedTag, application],
  )

  const hasNotes = items.some((item) => item.content_type === ContentType.Note)

  return (
    <div
      className={classNames(
        'infinite-scroll overflow-y-auto overflow-x-hidden focus:shadow-none focus:outline-none',
        'md:max-h-full md:overflow-y-hidden md:hover:overflow-y-auto pointer-coarse:md:overflow-y-auto',
        'flex flex-wrap pb-2 md:hover:[overflow-y:_overlay]',
        hasNotes ? 'justify-center' : 'justify-center md:justify-start md:pl-1',
      )}
      id={ElementIds.ContentList}
      onScroll={onScroll}
      onKeyDown={onKeyDown}
      tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
    >
      {items.map((item, index) => {
        const previousIndex = index - 1
        const previousItem = previousIndex >= 0 ? items[previousIndex] : undefined

        const nextIndex = index + 1
        const nextItem = nextIndex < items.length ? items[nextIndex] : undefined

        return (
          <ContentListItem
            key={item.uuid}
            application={application}
            item={item}
            selected={selectedUuids.has(item.uuid)}
            hideDate={hideDate}
            hidePreview={hideNotePreview}
            hideTags={hideTags}
            hideIcon={hideEditorIcon}
            sortBy={sortBy}
            filesController={filesController}
            onSelect={selectItem}
            tags={getTagsForItem(item)}
            notesController={notesController}
            isPreviousItemTiled={previousItem?.content_type === ContentType.File}
            isNextItemTiled={nextItem?.content_type === ContentType.File}
          />
        )
      })}
    </div>
  )
}

export default observer(ContentList)
