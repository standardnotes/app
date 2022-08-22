import { WebApplication } from '@/Application/Application'
import { KeyboardKey } from '@standardnotes/ui-services'
import { UuidString } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, KeyboardEventHandler, UIEventHandler, useCallback } from 'react'
import { FOCUSABLE_BUT_NOT_TABBABLE, NOTES_LIST_SCROLL_THRESHOLD } from '@/Constants/Constants'
import { ListableContentItem } from './Types/ListableContentItem'
import ContentListItem from './ContentListItem'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { FilesController } from '@/Controllers/FilesController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NotesController } from '@/Controllers/NotesController'
import { ElementIds } from '@/Constants/ElementIDs'
import { classNames } from '@/Utils/ConcatenateClassNames'

type Props = {
  application: WebApplication
  filesController: FilesController
  itemListController: ItemListController
  items: ListableContentItem[]
  navigationController: NavigationController
  notesController: NotesController
  selectionController: SelectedItemsController
  selectedItems: Record<UuidString, ListableContentItem>
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
  selectedItems,
  paginate,
}) => {
  const { selectPreviousItem, selectNextItem } = selectionController
  const { hideTags, hideDate, hideNotePreview, hideEditorIcon } = itemListController.webDisplayOptions
  const { sortBy } = itemListController.displayOptions

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

  return (
    <div
      className={classNames(
        'infinite-scroll max-h-[75vh] overflow-y-auto overflow-x-hidden focus:shadow-none focus:outline-none',
        'md:max-h-full md:overflow-y-hidden md:hover:overflow-y-auto',
        'md:hover:[overflow-y:_overlay]',
      )}
      id={ElementIds.ContentList}
      onScroll={onScroll}
      onKeyDown={onKeyDown}
      tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
    >
      {items.map((item) => (
        <ContentListItem
          key={item.uuid}
          application={application}
          item={item}
          selected={!!selectedItems[item.uuid]}
          hideDate={hideDate}
          hidePreview={hideNotePreview}
          hideTags={hideTags}
          hideIcon={hideEditorIcon}
          sortBy={sortBy}
          filesController={filesController}
          selectionController={selectionController}
          navigationController={navigationController}
          notesController={notesController}
        />
      ))}
    </div>
  )
}

export default observer(ContentList)
