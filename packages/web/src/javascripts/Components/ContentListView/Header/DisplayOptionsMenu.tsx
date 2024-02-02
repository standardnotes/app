import {
  CollectionSort,
  CollectionSortProperty,
  IconType,
  isSmartView,
  isSystemView,
  PrefKey,
  SystemViewId,
  TagMutator,
  TagPreferences,
  VectorIconNameOrEmoji,
  PrefDefaults,
  isTag,
} from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import Menu from '@/Components/Menu/Menu'
import { DisplayOptionsMenuProps } from './DisplayOptionsMenuProps'
import NewNotePreferences from './NewNotePreferences'
import { PreferenceMode } from './PreferenceMode'
import { classNames } from '@standardnotes/utils'
import NoSubscriptionBanner from '@/Components/NoSubscriptionBanner/NoSubscriptionBanner'
import MenuRadioButtonItem from '@/Components/Menu/MenuRadioButtonItem'
import MenuSwitchButtonItem from '@/Components/Menu/MenuSwitchButtonItem'
import { Pill } from '@/Components/Preferences/PreferencesComponents/Content'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { PaneLayout } from '@/Controllers/PaneController/PaneLayout'
import MenuSection from '@/Components/Menu/MenuSection'

const DailyEntryModeEnabled = true

const SortIcon = ({ enabled, reverse }: { enabled: boolean; reverse: boolean | undefined }) => {
  if (!enabled) {
    return null
  }
  return (
    <Icon
      type={reverse ? 'arrows-sort-up' : 'arrows-sort-down'}
      className="h-6 w-6 text-neutral md:h-5 md:w-6"
      size="custom"
    />
  )
}

const TabButton: FunctionComponent<{
  label: string
  mode: PreferenceMode
  icon?: VectorIconNameOrEmoji
  currentMode: PreferenceMode
  setCurrentMode: (mode: PreferenceMode) => void
}> = ({ mode, label, icon, currentMode, setCurrentMode }) => {
  const isSelected = currentMode === mode

  return (
    <button
      className={classNames(
        'relative cursor-pointer rounded-full border-2 border-solid border-transparent px-2 py-1 text-mobile-menu-item focus:shadow-none md:py-0 lg:text-sm',
        isSelected
          ? 'bg-info text-info-contrast'
          : 'bg-transparent text-text hover:bg-info-backdrop focus:bg-info-backdrop',
      )}
      onClick={() => {
        setCurrentMode(mode)
      }}
    >
      <div className="flex items-center justify-center">
        {icon && (
          <Icon
            size="custom"
            type={icon as IconType}
            className={classNames(
              'mr-1 h-4.5 w-4.5 cursor-pointer md:h-3.5 md:w-3.5',
              isSelected ? 'text-info-contrast' : 'text-neutral',
            )}
          />
        )}
        <div>{label}</div>
      </div>
    </button>
  )
}

const DisplayOptionsMenu: FunctionComponent<DisplayOptionsMenuProps> = ({
  application,
  isFilesSmartView,
  selectedTag,
  paneController,
}) => {
  const isRegularTag = isTag(selectedTag)
  const isSystemTag = isSmartView(selectedTag) && isSystemView(selectedTag)
  const selectedTagPreferences = isSystemTag
    ? application.getPreference(PrefKey.SystemViewPreferences)?.[selectedTag.uuid as SystemViewId]
    : selectedTag.preferences
  const hasSubscription = application.subscriptionController.hasFirstPartyOnlineOrOfflineSubscription()
  const [currentMode, setCurrentMode] = useState<PreferenceMode>(
    (hasSubscription && isRegularTag) || selectedTagPreferences ? 'tag' : 'global',
  )
  const [preferences, setPreferences] = useState<TagPreferences>({})
  const controlsDisabled = currentMode === 'tag' && !hasSubscription
  const isDailyEntry = selectedTagPreferences?.entryMode === 'daily'

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
        ...selectedTagPreferences,
      })
    }
  }, [application, currentMode, selectedTagPreferences])

  useEffect(() => {
    reloadPreferences()
  }, [reloadPreferences])

  const changeGlobalPreferences = useCallback(
    async (properties: Partial<TagPreferences>) => {
      for (const key of Object.keys(properties)) {
        const value = properties[key as keyof TagPreferences]
        await application.setPreference(key as PrefKey, value).catch(console.error)

        reloadPreferences()
      }
    },
    [application, reloadPreferences],
  )

  const changeSystemViewPreferences = useCallback(
    async (properties: Partial<TagPreferences>) => {
      if (!selectedTag) {
        return
      }

      if (!isSystemTag) {
        return
      }

      const systemViewPreferences = application.getPreference(PrefKey.SystemViewPreferences) || {}
      const systemViewPreferencesForTag = systemViewPreferences[selectedTag.uuid as SystemViewId] || {}

      await application.setPreference(PrefKey.SystemViewPreferences, {
        ...systemViewPreferences,
        [selectedTag.uuid as SystemViewId]: {
          ...systemViewPreferencesForTag,
          ...properties,
        },
      })

      reloadPreferences()
    },
    [application, isSystemTag, reloadPreferences, selectedTag],
  )

  const changePreferences = useCallback(
    async (properties: Partial<TagPreferences>) => {
      if (currentMode === 'global') {
        await changeGlobalPreferences(properties)
      } else if (isSystemTag) {
        await changeSystemViewPreferences(properties)
      } else {
        await application.changeAndSaveItem.execute<TagMutator>(selectedTag, (mutator) => {
          mutator.preferences = {
            ...mutator.preferences,
            ...properties,
          }
        })
      }
    },
    [currentMode, isSystemTag, changeGlobalPreferences, changeSystemViewPreferences, application, selectedTag],
  )

  const resetTagPreferences = useCallback(async () => {
    if (isSystemTag) {
      await application.setPreference(PrefKey.SystemViewPreferences, {
        ...application.getPreference(PrefKey.SystemViewPreferences),
        [selectedTag.uuid as SystemViewId]: undefined,
      })
      reloadPreferences()
      return
    }

    void application.changeAndSaveItem.execute<TagMutator>(selectedTag, (mutator) => {
      mutator.preferences = undefined
    })
  }, [application, isSystemTag, reloadPreferences, selectedTag])

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

  const toggleTableView = useCallback(() => {
    const useTableView = !preferences.useTableView
    void changePreferences({ useTableView })
    if (useTableView) {
      paneController.setPaneLayout(PaneLayout.TableView)
    }
  }, [preferences.useTableView, changePreferences, paneController])

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)
  const isTableViewEnabled = Boolean(isFilesSmartView || preferences.useTableView)
  const shouldHideNonApplicableOptions = isTableViewEnabled && !isMobileScreen

  return (
    <Menu className="text-sm" a11yLabel="Notes list options menu">
      <div className="my-1 px-3 text-base font-semibold uppercase text-text lg:text-xs">Preferences for</div>
      <div className={classNames('mt-1.5 flex w-full justify-between px-3', !controlsDisabled && 'mb-3')}>
        <div className="flex items-center gap-1.5">
          <TabButton label="Global" mode="global" currentMode={currentMode} setCurrentMode={setCurrentMode} />
          <TabButton
            label={selectedTag.title}
            icon={selectedTag.iconString}
            mode="tag"
            currentMode={currentMode}
            setCurrentMode={setCurrentMode}
          />
        </div>
        {currentMode === 'tag' && (
          <button className="text-base lg:text-sm" onClick={resetTagPreferences}>
            Reset
          </button>
        )}
      </div>

      {controlsDisabled && (
        <NoSubscriptionBanner
          className="m-2 mb-3 mt-2"
          application={application}
          title="Upgrade for per-tag preferences"
          message={
            DailyEntryModeEnabled
              ? 'Create powerful workflows and organizational layouts with per-tag display preferences and the all-new Daily Notebook calendar layout.'
              : 'Create powerful workflows and organizational layouts with per-tag display preferences.'
          }
        />
      )}

      <MenuSection title="Sort by">
        <MenuRadioButtonItem
          disabled={controlsDisabled || isDailyEntry}
          className="py-2"
          onClick={toggleSortByDateModified}
          checked={preferences.sortBy === CollectionSort.UpdatedAt}
        >
          <div className="ml-1 flex flex-grow items-center justify-between md:ml-2">
            <span>Date modified</span>
            <SortIcon enabled={preferences.sortBy === CollectionSort.UpdatedAt} reverse={preferences.sortReverse} />
          </div>
        </MenuRadioButtonItem>
        <MenuRadioButtonItem
          disabled={controlsDisabled || isDailyEntry}
          className="py-2"
          onClick={toggleSortByCreationDate}
          checked={preferences.sortBy === CollectionSort.CreatedAt}
        >
          <div className="ml-1 flex flex-grow items-center justify-between md:ml-2">
            <span>Creation date</span>
            <SortIcon enabled={preferences.sortBy === CollectionSort.CreatedAt} reverse={preferences.sortReverse} />
          </div>
        </MenuRadioButtonItem>
        <MenuRadioButtonItem
          disabled={controlsDisabled || isDailyEntry}
          className="py-2"
          onClick={toggleSortByTitle}
          checked={preferences.sortBy === CollectionSort.Title}
        >
          <div className="ml-1 flex flex-grow items-center justify-between md:ml-2">
            <span>Title</span>
            <SortIcon enabled={preferences.sortBy === CollectionSort.Title} reverse={preferences.sortReverse} />
          </div>
        </MenuRadioButtonItem>
      </MenuSection>

      <MenuSection title="View">
        {!shouldHideNonApplicableOptions && !isFilesSmartView && (
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
      </MenuSection>

      {!shouldHideNonApplicableOptions && (
        <MenuSection title="Other">
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
        </MenuSection>
      )}

      {currentMode === 'tag' && !isSystemTag && DailyEntryModeEnabled && !isTableViewEnabled && (
        <MenuSection>
          <MenuSwitchButtonItem
            disabled={controlsDisabled}
            className="py-1 hover:bg-contrast focus:bg-info-backdrop"
            checked={isDailyEntry}
            onChange={toggleEntryMode}
          >
            <div className="flex flex-col pr-5">
              <div className="flex flex-row items-center">
                <div className="text-base font-semibold uppercase text-text lg:text-xs">Daily Notebook</div>
                <Pill className="!py-0.5 px-1.5" style="success">
                  Labs
                </Pill>
              </div>
              <div className="mt-1">Capture new notes daily with a calendar-based layout</div>
            </div>
          </MenuSwitchButtonItem>
        </MenuSection>
      )}

      {currentMode === 'tag' && !isSystemTag && !isDailyEntry && (
        <MenuSection>
          <MenuSwitchButtonItem
            disabled={controlsDisabled}
            className="py-1 hover:bg-contrast focus:bg-info-backdrop"
            checked={isTableViewEnabled}
            onChange={toggleTableView}
          >
            <div className="flex flex-col pr-5">
              <div className="flex flex-row items-center">
                <div className="text-base font-semibold uppercase text-text lg:text-xs">Table view</div>
                <Pill className="!py-0.5 px-1.5" style="success">
                  Labs
                </Pill>
              </div>
              <div className="mt-1">Display the notes and files in the current tag in a table layout</div>
            </div>
          </MenuSwitchButtonItem>
        </MenuSection>
      )}

      {!shouldHideNonApplicableOptions && (!isSystemTag || currentMode === 'global') && (
        <MenuSection title="New note defaults">
          <NewNotePreferences
            disabled={controlsDisabled}
            application={application}
            selectedTag={selectedTag}
            mode={currentMode}
            changePreferencesCallback={changePreferences}
          />
        </MenuSection>
      )}
    </Menu>
  )
}

export default observer(DisplayOptionsMenu)
