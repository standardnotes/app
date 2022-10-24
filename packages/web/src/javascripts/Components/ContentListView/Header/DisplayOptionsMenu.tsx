import {
  CollectionSort,
  CollectionSortProperty,
  IconType,
  isSmartView,
  isSystemView,
  PrefKey,
  TagMutator,
  TagPreferences,
  VectorIconNameOrEmoji,
} from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import Menu from '@/Components/Menu/Menu'
import MenuItem from '@/Components/Menu/MenuItem'
import MenuItemSeparator from '@/Components/Menu/MenuItemSeparator'
import { MenuItemType } from '@/Components/Menu/MenuItemType'
import { DisplayOptionsMenuProps } from './DisplayOptionsMenuProps'
import { PrefDefaults } from '@/Constants/PrefDefaults'

type PreferenceMode = 'global' | 'tag'

const DisplayOptionsMenu: FunctionComponent<DisplayOptionsMenuProps> = ({
  closeDisplayOptionsMenu,
  application,
  isOpen,
  isFilesSmartView,
  selectedTag,
}) => {
  const isSystemTag = isSmartView(selectedTag) && isSystemView(selectedTag)
  const [currentMode, setCurrentMode] = useState<PreferenceMode>(selectedTag.preferences ? 'tag' : 'global')
  const [preferences, setPreferences] = useState<TagPreferences>({})

  const reloadPreferences = useCallback(() => {
    const globalValues: TagPreferences = {
      sortBy: application.getPreference(PrefKey.SortNotesBy, PrefDefaults[PrefKey.SortNotesBy]),
      sortReverse: application.getPreference(PrefKey.SortNotesReverse, PrefDefaults[PrefKey.SortNotesReverse]),
      showArchived: application.getPreference(PrefKey.NotesShowArchived, PrefDefaults[PrefKey.NotesShowArchived]),
      showTrashed: application.getPreference(PrefKey.NotesShowTrashed, PrefDefaults[PrefKey.NotesShowTrashed]),
      hideProtected: application.getPreference(PrefKey.NotesHideProtected, PrefDefaults[PrefKey.NotesHideProtected]),
      hidePinned: application.getPreference(PrefKey.NotesHidePinned, PrefDefaults[PrefKey.NotesHidePinned]),
      hideNotePreview: application.getPreference(
        PrefKey.NotesHideNotePreview,
        PrefDefaults[PrefKey.NotesHideNotePreview],
      ),
      hideDate: application.getPreference(PrefKey.NotesHideDate, PrefDefaults[PrefKey.NotesHideDate]),
      hideTags: application.getPreference(PrefKey.NotesHideTags, PrefDefaults[PrefKey.NotesHideTags]),
      hideEditorIcon: application.getPreference(PrefKey.NotesHideEditorIcon, PrefDefaults[PrefKey.NotesHideEditorIcon]),
      newNoteTitleFormat: application.getPreference(
        PrefKey.NewNoteTitleFormat,
        PrefDefaults[PrefKey.NewNoteTitleFormat],
      ),
      customNoteTitleFormat: application.getPreference(
        PrefKey.CustomNoteTitleFormat,
        PrefDefaults[PrefKey.CustomNoteTitleFormat],
      ),
    }

    if (currentMode === 'global') {
      setPreferences(globalValues)
    } else {
      setPreferences({
        ...globalValues,
        ...selectedTag.preferences,
      })
    }
  }, [currentMode, setPreferences, selectedTag, application])

  useEffect(() => {
    reloadPreferences()
  }, [reloadPreferences])

  const changePreferences = useCallback(
    async (properties: Partial<TagPreferences>) => {
      if (currentMode === 'global') {
        for (const key of Object.keys(properties)) {
          const value = properties[key as keyof TagPreferences]
          await application.setPreference(key as PrefKey, value).catch(console.error)

          reloadPreferences()
        }
      } else {
        application.mutator.changeAndSaveItem<TagMutator>(selectedTag, (mutator) => {
          mutator.preferences = {
            ...mutator.preferences,
            ...properties,
          }
        })
      }
    },
    [reloadPreferences],
  )

  const resetTagPreferences = useCallback(() => {
    application.mutator.changeAndSaveItem<TagMutator>(selectedTag, (mutator) => {
      mutator.preferences = undefined
    })
  }, [])

  const toggleSortReverse = useCallback(() => {
    changePreferences({ sortReverse: !preferences.sortReverse })
  }, [application, preferences, changePreferences])

  const toggleSortBy = useCallback(
    (sort: CollectionSortProperty) => {
      if (preferences.sortBy === sort) {
        toggleSortReverse()
      } else {
        changePreferences({ sortBy: sort })
      }
    },
    [application, preferences, changePreferences, toggleSortReverse],
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
    changePreferences({ hideNotePreview: !preferences.hideNotePreview })
  }, [application, preferences, changePreferences])

  const toggleHideDate = useCallback(() => {
    changePreferences({ hideDate: !preferences.hideDate })
  }, [application, preferences, changePreferences])

  const toggleHideTags = useCallback(() => {
    changePreferences({ hideTags: !preferences.hideTags })
  }, [application, preferences, changePreferences])

  const toggleHidePinned = useCallback(() => {
    changePreferences({ hidePinned: !preferences.hidePinned })
  }, [application, preferences, changePreferences])

  const toggleShowArchived = useCallback(() => {
    changePreferences({ showArchived: !preferences.showArchived })
  }, [application, preferences, changePreferences])

  const toggleShowTrashed = useCallback(() => {
    changePreferences({ showArchived: !preferences.showTrashed })
  }, [application, preferences, changePreferences])

  const toggleHideProtected = useCallback(() => {
    changePreferences({ hideProtected: !preferences.hideProtected })
  }, [application, preferences, changePreferences])

  const toggleEditorIcon = useCallback(() => {
    changePreferences({ hideEditorIcon: !preferences.hideEditorIcon })
  }, [application, preferences, changePreferences])

  const TabButton: FunctionComponent<{
    label: string
    mode: PreferenceMode
    icon?: VectorIconNameOrEmoji
  }> = ({ mode, label, icon }) => {
    const isSelected = currentMode === mode

    return (
      <button
        className={`relative mr-3 cursor-pointer border-0 bg-default text-sm focus:shadow-none ${
          isSelected ? 'font-bold text-info' : 'text-text'
        }`}
        onClick={() => {
          setCurrentMode(mode)
        }}
      >
        <div className="flex">
          {icon && <Icon type={icon as IconType} className={`mr-1 ${isSelected ? 'text-info' : 'text-neutral'}`} />}
          {label}
        </div>
      </button>
    )
  }

  return (
    <Menu className="text-sm" a11yLabel="Notes list options menu" closeMenu={closeDisplayOptionsMenu} isOpen={isOpen}>
      <div className="my-1 px-3 text-xs font-semibold uppercase text-text">Preferences for</div>
      <div className="mt-2 flex w-full justify-between px-3">
        <div className="my-1 flex items-center">
          <TabButton label="Default" mode="global" />
          {!isSystemTag && <TabButton label={selectedTag.title} icon={selectedTag.iconString} mode="tag" />}
        </div>
        {currentMode === 'tag' && <button onClick={resetTagPreferences}>Reset</button>}
      </div>
      <MenuItemSeparator />
      <div className="my-1 px-3 text-xs font-semibold uppercase text-text">Sort by</div>
      <MenuItem
        className="py-2"
        type={MenuItemType.RadioButton}
        onClick={toggleSortByDateModified}
        checked={preferences.sortBy === CollectionSort.UpdatedAt}
      >
        <div className="ml-2 flex flex-grow items-center justify-between">
          <span>Date modified</span>
          {preferences.sortBy === CollectionSort.UpdatedAt ? (
            preferences.sortReverse ? (
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
        checked={preferences.sortBy === CollectionSort.CreatedAt}
      >
        <div className="ml-2 flex flex-grow items-center justify-between">
          <span>Creation date</span>
          {preferences.sortBy === CollectionSort.CreatedAt ? (
            preferences.sortReverse ? (
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
        checked={preferences.sortBy === CollectionSort.Title}
      >
        <div className="ml-2 flex flex-grow items-center justify-between">
          <span>Title</span>
          {preferences.sortBy === CollectionSort.Title ? (
            preferences.sortReverse ? (
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
          checked={!preferences.hideNotePreview}
          onChange={toggleHidePreview}
        >
          <div className="max-w-3/4 flex flex-col">Show note preview</div>
        </MenuItem>
      )}
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!preferences.hideDate}
        onChange={toggleHideDate}
      >
        Show date
      </MenuItem>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!preferences.hideTags}
        onChange={toggleHideTags}
      >
        Show tags
      </MenuItem>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!preferences.hideEditorIcon}
        onChange={toggleEditorIcon}
      >
        Show icon
      </MenuItem>
      <MenuItemSeparator />
      <div className="px-3 py-1 text-xs font-semibold uppercase text-text">Other</div>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!preferences.hidePinned}
        onChange={toggleHidePinned}
      >
        Show pinned
      </MenuItem>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!preferences.hideProtected}
        onChange={toggleHideProtected}
      >
        Show protected
      </MenuItem>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={preferences.showArchived}
        onChange={toggleShowArchived}
      >
        Show archived
      </MenuItem>
      <MenuItem
        type={MenuItemType.SwitchButton}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={preferences.showTrashed}
        onChange={toggleShowTrashed}
      >
        Show trashed
      </MenuItem>
    </Menu>
  )
}

export default observer(DisplayOptionsMenu)
