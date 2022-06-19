import { WebApplication } from '@/Application/Application'
import { CollectionSort, CollectionSortProperty, PrefKey, SystemViewId } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import Menu from '@/Components/Menu/Menu'
import MenuItem from '@/Components/Menu/MenuItem'
import MenuItemSeparator from '@/Components/Menu/MenuItemSeparator'
import { MenuItemType } from '@/Components/Menu/MenuItemType'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'

type Props = {
  application: WebApplication
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void
  closeDisplayOptionsMenu: () => void
  isOpen: boolean
  navigationController: NavigationController
}

const ContentListOptionsMenu: FunctionComponent<Props> = ({
  closeDisplayOptionsMenu,
  closeOnBlur,
  application,
  isOpen,
  navigationController,
}) => {
  const [sortBy, setSortBy] = useState(() => application.getPreference(PrefKey.SortNotesBy, CollectionSort.CreatedAt))
  const [sortReverse, setSortReverse] = useState(() => application.getPreference(PrefKey.SortNotesReverse, false))
  const [hidePreview, setHidePreview] = useState(() => application.getPreference(PrefKey.NotesHideNotePreview, false))
  const [hideDate, setHideDate] = useState(() => application.getPreference(PrefKey.NotesHideDate, false))
  const [hideTags, setHideTags] = useState(() => application.getPreference(PrefKey.NotesHideTags, true))
  const [hidePinned, setHidePinned] = useState(() => application.getPreference(PrefKey.NotesHidePinned, false))
  const [showArchived, setShowArchived] = useState(() => application.getPreference(PrefKey.NotesShowArchived, false))
  const [showTrashed, setShowTrashed] = useState(() => application.getPreference(PrefKey.NotesShowTrashed, false))
  const [hideProtected, setHideProtected] = useState(() => application.getPreference(PrefKey.NotesHideProtected, false))
  const [hideEditorIcon, setHideEditorIcon] = useState(() =>
    application.getPreference(PrefKey.NotesHideEditorIcon, false),
  )

  const toggleSortReverse = useCallback(() => {
    application.setPreference(PrefKey.SortNotesReverse, !sortReverse).catch(console.error)
    setSortReverse(!sortReverse)
  }, [application, sortReverse])

  const toggleSortBy = useCallback(
    (sort: CollectionSortProperty) => {
      if (sortBy === sort) {
        toggleSortReverse()
      } else {
        setSortBy(sort)
        application.setPreference(PrefKey.SortNotesBy, sort).catch(console.error)
      }
    },
    [application, sortBy, toggleSortReverse],
  )

  const toggleSortByDateModified = useCallback(() => {
    toggleSortBy(CollectionSort.UpdatedAt)
  }, [toggleSortBy])

  const toggleSortByCreationDate = useCallback(() => {
    toggleSortBy(CollectionSort.CreatedAt)
  }, [toggleSortBy])

  const toggleSortByTitle = useCallback(() => {
    toggleSortBy(CollectionSort.Title)
  }, [toggleSortBy])

  const toggleHidePreview = useCallback(() => {
    setHidePreview(!hidePreview)
    application.setPreference(PrefKey.NotesHideNotePreview, !hidePreview).catch(console.error)
  }, [application, hidePreview])

  const toggleHideDate = useCallback(() => {
    setHideDate(!hideDate)
    application.setPreference(PrefKey.NotesHideDate, !hideDate).catch(console.error)
  }, [application, hideDate])

  const toggleHideTags = useCallback(() => {
    setHideTags(!hideTags)
    application.setPreference(PrefKey.NotesHideTags, !hideTags).catch(console.error)
  }, [application, hideTags])

  const toggleHidePinned = useCallback(() => {
    setHidePinned(!hidePinned)
    application.setPreference(PrefKey.NotesHidePinned, !hidePinned).catch(console.error)
  }, [application, hidePinned])

  const toggleShowArchived = useCallback(() => {
    setShowArchived(!showArchived)
    application.setPreference(PrefKey.NotesShowArchived, !showArchived).catch(console.error)
  }, [application, showArchived])

  const toggleShowTrashed = useCallback(() => {
    setShowTrashed(!showTrashed)
    application.setPreference(PrefKey.NotesShowTrashed, !showTrashed).catch(console.error)
  }, [application, showTrashed])

  const toggleHideProtected = useCallback(() => {
    setHideProtected(!hideProtected)
    application.setPreference(PrefKey.NotesHideProtected, !hideProtected).catch(console.error)
  }, [application, hideProtected])

  const toggleEditorIcon = useCallback(() => {
    setHideEditorIcon(!hideEditorIcon)
    application.setPreference(PrefKey.NotesHideEditorIcon, !hideEditorIcon).catch(console.error)
  }, [application, hideEditorIcon])

  return (
    <Menu
      className={
        'sn-dropdown sn-dropdown--animated min-w-70 overflow-y-auto \
        border-1 border-solid border-main text-sm z-index-dropdown-menu \
        flex flex-col py-2 top-full left-2 absolute'
      }
      a11yLabel="Notes list options menu"
      closeMenu={closeDisplayOptionsMenu}
      isOpen={isOpen}
    >
      <div className="px-3 my-1 text-xs font-semibold color-text uppercase">Sort by</div>
      <MenuItem
        className="py-2"
        type={MenuItemType.RadioButton}
        onClick={toggleSortByDateModified}
        checked={sortBy === CollectionSort.UpdatedAt}
        onBlur={closeOnBlur}
      >
        <div className="flex flex-grow items-center justify-between ml-2">
          <span>Date modified</span>
          {sortBy === CollectionSort.UpdatedAt ? (
            sortReverse ? (
              <Icon type="arrows-sort-up" className="color-neutral" />
            ) : (
              <Icon type="arrows-sort-down" className="color-neutral" />
            )
          ) : null}
        </div>
      </MenuItem>
      <MenuItem
        className="py-2"
        type={MenuItemType.RadioButton}
        onClick={toggleSortByCreationDate}
        checked={sortBy === CollectionSort.CreatedAt}
        onBlur={closeOnBlur}
      >
        <div className="flex flex-grow items-center justify-between ml-2">
          <span>Creation date</span>
          {sortBy === CollectionSort.CreatedAt ? (
            sortReverse ? (
              <Icon type="arrows-sort-up" className="color-neutral" />
            ) : (
              <Icon type="arrows-sort-down" className="color-neutral" />
            )
          ) : null}
        </div>
      </MenuItem>
      <MenuItem
        className="py-2"
        type={MenuItemType.RadioButton}
        onClick={toggleSortByTitle}
        checked={sortBy === CollectionSort.Title}
        onBlur={closeOnBlur}
      >
        <div className="flex flex-grow items-center justify-between ml-2">
          <span>Title</span>
          {sortBy === CollectionSort.Title ? (
            sortReverse ? (
              <Icon type="arrows-sort-up" className="color-neutral" />
            ) : (
              <Icon type="arrows-sort-down" className="color-neutral" />
            )
          ) : null}
        </div>
      </MenuItem>
      <MenuItemSeparator />
      <div className="px-3 py-1 text-xs font-semibold color-text uppercase">View</div>
      {navigationController.selectedUuid !== SystemViewId.Files && (
        <MenuItem
          type={MenuItemType.SwitchButton}
          className="py-1 hover:bg-contrast focus:bg-info-backdrop"
          checked={!hidePreview}
          onChange={toggleHidePreview}
          onBlur={closeOnBlur}
        >
          <div className="flex flex-col max-w-3/4">Show note preview</div>
        </MenuItem>
      )}
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!hideDate}
        onChange={toggleHideDate}
        onBlur={closeOnBlur}
      >
        Show date
      </MenuItem>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!hideTags}
        onChange={toggleHideTags}
        onBlur={closeOnBlur}
      >
        Show tags
      </MenuItem>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!hideEditorIcon}
        onChange={toggleEditorIcon}
        onBlur={closeOnBlur}
      >
        Show icon
      </MenuItem>
      <div className="h-1px my-2 bg-border"></div>
      <div className="px-3 py-1 text-xs font-semibold color-text uppercase">Other</div>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!hidePinned}
        onChange={toggleHidePinned}
        onBlur={closeOnBlur}
      >
        Show pinned
      </MenuItem>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!hideProtected}
        onChange={toggleHideProtected}
        onBlur={closeOnBlur}
      >
        Show protected
      </MenuItem>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={showArchived}
        onChange={toggleShowArchived}
        onBlur={closeOnBlur}
      >
        Show archived
      </MenuItem>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={showTrashed}
        onChange={toggleShowTrashed}
        onBlur={closeOnBlur}
      >
        Show trashed
      </MenuItem>
    </Menu>
  )
}

export default observer(ContentListOptionsMenu)
