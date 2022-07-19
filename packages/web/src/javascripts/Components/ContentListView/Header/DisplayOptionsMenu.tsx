import { CollectionSort, CollectionSortProperty, PrefKey } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import Menu from '@/Components/Menu/Menu'
import MenuItem from '@/Components/Menu/MenuItem'
import MenuItemSeparator from '@/Components/Menu/MenuItemSeparator'
import { MenuItemType } from '@/Components/Menu/MenuItemType'
import { DisplayOptionsMenuProps } from './DisplayOptionsMenuProps'

const DisplayOptionsMenu: FunctionComponent<DisplayOptionsMenuProps> = ({
  closeDisplayOptionsMenu,
  application,
  isOpen,
  isFilesSmartView,
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
    <Menu className="text-sm" a11yLabel="Notes list options menu" closeMenu={closeDisplayOptionsMenu} isOpen={isOpen}>
      <div className="my-1 px-3 text-xs font-semibold uppercase text-text">Sort by</div>
      <MenuItem
        className="py-2"
        type={MenuItemType.RadioButton}
        onClick={toggleSortByDateModified}
        checked={sortBy === CollectionSort.UpdatedAt}
      >
        <div className="ml-2 flex flex-grow items-center justify-between">
          <span>Date modified</span>
          {sortBy === CollectionSort.UpdatedAt ? (
            sortReverse ? (
              <Icon type="arrows-sort-up" className="text-neutral" />
            ) : (
              <Icon type="arrows-sort-down" className="text-neutral" />
            )
          ) : null}
        </div>
      </MenuItem>
      <MenuItem
        className="py-2"
        type={MenuItemType.RadioButton}
        onClick={toggleSortByCreationDate}
        checked={sortBy === CollectionSort.CreatedAt}
      >
        <div className="ml-2 flex flex-grow items-center justify-between">
          <span>Creation date</span>
          {sortBy === CollectionSort.CreatedAt ? (
            sortReverse ? (
              <Icon type="arrows-sort-up" className="text-neutral" />
            ) : (
              <Icon type="arrows-sort-down" className="text-neutral" />
            )
          ) : null}
        </div>
      </MenuItem>
      <MenuItem
        className="py-2"
        type={MenuItemType.RadioButton}
        onClick={toggleSortByTitle}
        checked={sortBy === CollectionSort.Title}
      >
        <div className="ml-2 flex flex-grow items-center justify-between">
          <span>Title</span>
          {sortBy === CollectionSort.Title ? (
            sortReverse ? (
              <Icon type="arrows-sort-up" className="text-neutral" />
            ) : (
              <Icon type="arrows-sort-down" className="text-neutral" />
            )
          ) : null}
        </div>
      </MenuItem>
      <MenuItemSeparator />
      <div className="px-3 py-1 text-xs font-semibold uppercase text-text">View</div>
      {!isFilesSmartView && (
        <MenuItem
          type={MenuItemType.SwitchButton}
          className="py-1 hover:bg-contrast focus:bg-info-backdrop"
          checked={!hidePreview}
          onChange={toggleHidePreview}
        >
          <div className="max-w-3/4 flex flex-col">Show note preview</div>
        </MenuItem>
      )}
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!hideDate}
        onChange={toggleHideDate}
      >
        Show date
      </MenuItem>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!hideTags}
        onChange={toggleHideTags}
      >
        Show tags
      </MenuItem>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!hideEditorIcon}
        onChange={toggleEditorIcon}
      >
        Show icon
      </MenuItem>
      <MenuItemSeparator />
      <div className="px-3 py-1 text-xs font-semibold uppercase text-text">Other</div>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!hidePinned}
        onChange={toggleHidePinned}
      >
        Show pinned
      </MenuItem>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!hideProtected}
        onChange={toggleHideProtected}
      >
        Show protected
      </MenuItem>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={showArchived}
        onChange={toggleShowArchived}
      >
        Show archived
      </MenuItem>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={showTrashed}
        onChange={toggleShowTrashed}
      >
        Show trashed
      </MenuItem>
    </Menu>
  )
}

export default observer(DisplayOptionsMenu)
