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
import MenuItemSeparator from '@/Components/Menu/MenuItemSeparator'
import { DisplayOptionsMenuProps } from './DisplayOptionsMenuProps'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import NewNotePreferences from './NewNotePreferences'
import { PreferenceMode } from './PreferenceMode'
import { classNames } from '@standardnotes/utils'
import NoSubscriptionBanner from '@/Components/NoSubscriptionBanner/NoSubscriptionBanner'
import MenuRadioButtonItem from '@/Components/Menu/MenuRadioButtonItem'
import MenuSwitchButtonItem from '@/Components/Menu/MenuSwitchButtonItem'

const DailyEntryModeEnabled = true

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
  const hasSubscription = application.hasValidSubscription()
  const controlsDisabled = currentMode === 'tag' && !hasSubscription
  const isDailyEntry = selectedTag.preferences?.entryMode === 'daily'

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
        await application.mutator.changeAndSaveItem<TagMutator>(selectedTag, (mutator) => {
          mutator.preferences = {
            ...mutator.preferences,
            ...properties,
          }
        })
      }
    },
    [reloadPreferences, application, currentMode, selectedTag],
  )

  const resetTagPreferences = useCallback(() => {
    void application.mutator.changeAndSaveItem<TagMutator>(selectedTag, (mutator) => {
      mutator.preferences = undefined
    })
  }, [application, selectedTag])

  const toggleSortReverse = useCallback(() => {
    void changePreferences({ sortReverse: !preferences.sortReverse })
  }, [preferences, changePreferences])

  const toggleSortBy = useCallback(
    (sort: CollectionSortProperty) => {
      if (preferences.sortBy === sort) {
        toggleSortReverse()
      } else {
        void changePreferences({ sortBy: sort })
      }
    },
    [preferences.sortBy, toggleSortReverse, changePreferences],
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
    void changePreferences({ hideNotePreview: !preferences.hideNotePreview })
  }, [preferences, changePreferences])

  const toggleHideDate = useCallback(() => {
    void changePreferences({ hideDate: !preferences.hideDate })
  }, [preferences, changePreferences])

  const toggleHideTags = useCallback(() => {
    void changePreferences({ hideTags: !preferences.hideTags })
  }, [preferences, changePreferences])

  const toggleHidePinned = useCallback(() => {
    void changePreferences({ hidePinned: !preferences.hidePinned })
  }, [preferences, changePreferences])

  const toggleShowArchived = useCallback(() => {
    void changePreferences({ showArchived: !preferences.showArchived })
  }, [preferences, changePreferences])

  const toggleShowTrashed = useCallback(() => {
    void changePreferences({ showTrashed: !preferences.showTrashed })
  }, [preferences, changePreferences])

  const toggleHideProtected = useCallback(() => {
    void changePreferences({ hideProtected: !preferences.hideProtected })
  }, [preferences, changePreferences])

  const toggleEditorIcon = useCallback(() => {
    void changePreferences({ hideEditorIcon: !preferences.hideEditorIcon })
  }, [preferences, changePreferences])

  const toggleEntryMode = useCallback(() => {
    void changePreferences({ entryMode: isDailyEntry ? 'normal' : 'daily' })
  }, [isDailyEntry, changePreferences])

  const TabButton: FunctionComponent<{
    label: string
    mode: PreferenceMode
    icon?: VectorIconNameOrEmoji
  }> = ({ mode, label, icon }) => {
    const isSelected = currentMode === mode

    return (
      <button
        className={classNames(
          'relative cursor-pointer rounded-full border-2 border-solid border-transparent px-2 text-base focus:shadow-none lg:text-sm',
          isSelected ? 'bg-info text-info-contrast' : 'bg-transparent text-text hover:bg-info-backdrop',
        )}
        onClick={() => {
          setCurrentMode(mode)
        }}
      >
        <div className="flex items-center justify-center">
          {icon && (
            <Icon
              size="small"
              type={icon as IconType}
              className={classNames('mr-1 cursor-pointer', isSelected ? 'text-info-contrast' : 'text-neutral')}
            />
          )}
          <div>{label}</div>
        </div>
      </button>
    )
  }

  return (
    <Menu className="text-sm" a11yLabel="Notes list options menu" closeMenu={closeDisplayOptionsMenu} isOpen={isOpen}>
      <div className="my-1 px-3 text-base font-semibold uppercase text-text lg:text-xs">Preferences for</div>
      <div className={classNames('mt-1.5 flex w-full justify-between px-3', !controlsDisabled && 'mb-3')}>
        <div className="flex items-center gap-1.5">
          <TabButton label="Global" mode="global" />
          {!isSystemTag && <TabButton label={selectedTag.title} icon={selectedTag.iconString} mode="tag" />}
        </div>
        {currentMode === 'tag' && (
          <button className="text-base lg:text-sm" onClick={resetTagPreferences}>
            Reset
          </button>
        )}
      </div>

      {controlsDisabled && (
        <NoSubscriptionBanner
          className="m-2 mt-2 mb-3"
          application={application}
          title="Upgrade for per-tag preferences"
          message={
            DailyEntryModeEnabled
              ? 'Create powerful workflows and organizational layouts with per-tag display preferences and the all-new Daily Notebook calendar layout.'
              : 'Create powerful workflows and organizational layouts with per-tag display preferences.'
          }
        />
      )}

      <MenuItemSeparator />

      <div className="my-1 px-3 text-base font-semibold uppercase text-text lg:text-xs">Sort by</div>
      <MenuRadioButtonItem
        disabled={controlsDisabled || isDailyEntry}
        className="py-2"
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
      </MenuRadioButtonItem>
      <MenuRadioButtonItem
        disabled={controlsDisabled || isDailyEntry}
        className="py-2"
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
      </MenuRadioButtonItem>
      <MenuRadioButtonItem
        disabled={controlsDisabled || isDailyEntry}
        className="py-2"
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
      </MenuRadioButtonItem>
      <MenuItemSeparator />
      <div className="px-3 py-1 text-base font-semibold uppercase text-text lg:text-xs">View</div>
      {!isFilesSmartView && (
        <MenuSwitchButtonItem
          disabled={controlsDisabled}
          className="py-1 hover:bg-contrast focus:bg-info-backdrop"
          checked={!preferences.hideNotePreview}
          onChange={toggleHidePreview}
        >
          <div className="max-w-3/4 flex flex-col">Show note preview</div>
        </MenuSwitchButtonItem>
      )}
      <MenuSwitchButtonItem
        disabled={controlsDisabled}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!preferences.hideDate}
        onChange={toggleHideDate}
      >
        Show date
      </MenuSwitchButtonItem>
      <MenuSwitchButtonItem
        disabled={controlsDisabled}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!preferences.hideTags}
        onChange={toggleHideTags}
      >
        Show tags
      </MenuSwitchButtonItem>
      <MenuSwitchButtonItem
        disabled={controlsDisabled}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!preferences.hideEditorIcon}
        onChange={toggleEditorIcon}
      >
        Show icon
      </MenuSwitchButtonItem>
      <MenuItemSeparator />
      <div className="px-3 py-1 text-base font-semibold uppercase text-text lg:text-xs">Other</div>
      <MenuSwitchButtonItem
        disabled={controlsDisabled}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!preferences.hidePinned}
        onChange={toggleHidePinned}
      >
        Show pinned
      </MenuSwitchButtonItem>
      <MenuSwitchButtonItem
        disabled={controlsDisabled}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={!preferences.hideProtected}
        onChange={toggleHideProtected}
      >
        Show protected
      </MenuSwitchButtonItem>
      <MenuSwitchButtonItem
        disabled={controlsDisabled}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={Boolean(preferences.showArchived)}
        onChange={toggleShowArchived}
      >
        Show archived
      </MenuSwitchButtonItem>
      <MenuSwitchButtonItem
        disabled={controlsDisabled}
        className="py-1 hover:bg-contrast focus:bg-info-backdrop"
        checked={Boolean(preferences.showTrashed)}
        onChange={toggleShowTrashed}
      >
        Show trashed
      </MenuSwitchButtonItem>

      {currentMode === 'tag' && DailyEntryModeEnabled && (
        <>
          <MenuItemSeparator />
          <MenuSwitchButtonItem
            disabled={controlsDisabled}
            className="py-1 hover:bg-contrast focus:bg-info-backdrop"
            checked={isDailyEntry}
            onChange={toggleEntryMode}
          >
            <div className="flex flex-col pr-5">
              <div className="flex flex-row items-center">
                <div className="text-base font-semibold uppercase text-text lg:text-xs">Daily Notebook</div>
                <div className="ml-2 rounded bg-success px-1.5 py-[1px] text-[10px] font-bold text-success-contrast">
                  Experimental
                </div>
              </div>
              <div className="mt-1">Capture new notes daily with a calendar-based layout</div>
            </div>
          </MenuSwitchButtonItem>
        </>
      )}

      <MenuItemSeparator />

      <NewNotePreferences
        disabled={controlsDisabled}
        application={application}
        selectedTag={selectedTag}
        mode={currentMode}
        changePreferencesCallback={changePreferences}
      />
    </Menu>
  )
}

export default observer(DisplayOptionsMenu)
