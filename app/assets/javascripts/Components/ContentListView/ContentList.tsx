import { WebApplication } from '@/UIModels/Application'
import { KeyboardKey } from '@/Services/IOService'
import { AppState } from '@/UIModels/AppState'
import { DisplayOptions } from '@/UIModels/AppState/ContentListViewState'
import { UuidString } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'
import { FOCUSABLE_BUT_NOT_TABBABLE, NOTES_LIST_SCROLL_THRESHOLD } from '@/Constants'
import { ListableContentItem } from './types'
import { ContentListItem } from './ContentListItem'

type Props = {
  application: WebApplication
  appState: AppState
  items: ListableContentItem[]
  selectedItems: Record<UuidString, ListableContentItem>
  displayOptions: DisplayOptions
  paginate: () => void
}

export const ContentList: FunctionComponent<Props> = observer(
  ({ application, appState, items, selectedItems, displayOptions, paginate }) => {
    const { selectPreviousItem, selectNextItem } = appState.contentListView
    const { hideTags, hideDate, hideNotePreview, hideEditorIcon, sortBy } = displayOptions

    const onScroll = (e: Event) => {
      const offset = NOTES_LIST_SCROLL_THRESHOLD
      const element = e.target as HTMLElement
      if (element.scrollTop + element.offsetHeight >= element.scrollHeight - offset) {
        paginate()
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.Up) {
        e.preventDefault()
        selectPreviousItem()
      } else if (e.key === KeyboardKey.Down) {
        e.preventDefault()
        selectNextItem()
      }
    }

    return (
      <div
        className="infinite-scroll focus:shadow-none focus:outline-none"
        id="notes-scrollable"
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      >
        {items.map((item) => (
          <ContentListItem
            key={item.uuid}
            application={application}
            appState={appState}
            item={item}
            selected={!!selectedItems[item.uuid]}
            hideDate={hideDate}
            hidePreview={hideNotePreview}
            hideTags={hideTags}
            hideIcon={hideEditorIcon}
            sortBy={sortBy}
          />
        ))}
      </div>
    )
  },
)
