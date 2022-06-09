import { AppStateType } from '@Lib/ApplicationState'
import { useSignedIn, useSyncStatus } from '@Lib/SnjsHelperHooks'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { AppStackNavigationProp } from '@Root/AppStack'
import { useSafeApplicationContext } from '@Root/Hooks/useSafeApplicationContext'
import { SCREEN_COMPOSE, SCREEN_NOTES, SCREEN_VIEW_PROTECTED_NOTE } from '@Root/Screens/screens'
import {
  ApplicationEvent,
  CollectionSort,
  CollectionSortProperty,
  ContentType,
  PrefKey,
  SmartView,
  SNNote,
  SNTag,
  SystemViewId,
  UuidString,
} from '@standardnotes/snjs'
import { ICON_ADD } from '@Style/Icons'
import { ThemeService } from '@Style/ThemeService'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import FAB from 'react-native-fab'
import { ThemeContext } from 'styled-components'
import { NoteList } from './NoteList'
import { StyledIcon } from './Notes.styled'

type SearchOptions = {
  selected: boolean
  onPress: () => void
  label: string
}[]

export const Notes = React.memo(
  ({ isInTabletMode, keyboardHeight }: { isInTabletMode: boolean | undefined; keyboardHeight: number | undefined }) => {
    const application = useSafeApplicationContext()
    const theme = useContext(ThemeContext)
    const navigation = useNavigation<AppStackNavigationProp<typeof SCREEN_NOTES>['navigation']>()

    const [loading, decrypting, refreshing, startRefreshing] = useSyncStatus()
    const [signedIn] = useSignedIn()

    const [sortBy, setSortBy] = useState<CollectionSortProperty>(() =>
      application.getLocalPreferences().getValue(PrefKey.MobileSortNotesBy, CollectionSort.CreatedAt),
    )
    const [sortReverse, setSortReverse] = useState<boolean>(() =>
      application.getLocalPreferences().getValue(PrefKey.MobileSortNotesReverse, false),
    )
    const [hideDates, setHideDates] = useState<boolean>(() =>
      application.getLocalPreferences().getValue(PrefKey.MobileNotesHideDate, false),
    )
    const [hidePreviews, setHidePreviews] = useState<boolean>(() =>
      application.getLocalPreferences().getValue(PrefKey.MobileNotesHideNotePreview, false),
    )
    const [hideEditorIcon, setHideEditorIcon] = useState<boolean>(() =>
      application.getLocalPreferences().getValue(PrefKey.MobileNotesHideEditorIcon, false),
    )
    const [notes, setNotes] = useState<SNNote[]>([])
    const [selectedNoteId, setSelectedNoteId] = useState<SNNote['uuid']>()
    const [searchText, setSearchText] = useState('')
    const [searchOptions, setSearchOptions] = useState<SearchOptions>([])
    const [includeProtectedNoteText, setIncludeProtectedNoteText] = useState<boolean>(
      () => !(application.hasProtectionSources() && !application.hasUnprotectedAccessSession()),
    )
    const [includeArchivedNotes, setIncludeArchivedNotes] = useState<boolean>(false)
    const [includeTrashedNotes, setIncludeTrashedNotes] = useState<boolean>(false)
    const [includeProtectedStarted, setIncludeProtectedStarted] = useState<boolean>(false)
    const [shouldFocusSearch, setShouldFocusSearch] = useState<boolean>(false)

    const haveDisplayOptions = useRef(false)
    const protectionsEnabled = useRef(application.hasProtectionSources() && !application.hasUnprotectedAccessSession())

    const reloadTitle = useCallback(
      (newNotes?: SNNote[], newFilter?: string) => {
        let title = ''
        let subTitle: string | undefined

        const selectedTag = application.getAppState().selectedTag

        if (newNotes && (newFilter ?? searchText).length > 0) {
          const resultCount = newNotes.length
          title = resultCount === 1 ? `${resultCount} search result` : `${resultCount} search results`
        } else if (selectedTag) {
          title = selectedTag.title
          if (selectedTag instanceof SNTag && selectedTag.parentId) {
            const parents = application.items.getTagParentChain(selectedTag)
            const hierarchy = parents.map(tag => tag.title).join(' ⫽ ')
            subTitle = hierarchy.length > 0 ? `in ${hierarchy}` : undefined
          }
        }

        navigation.setParams({
          title,
          subTitle,
        })
      },
      [application, navigation, searchText],
    )

    const openCompose = useCallback(
      (newNote: boolean, noteUuid: UuidString, replaceScreen = false) => {
        if (!isInTabletMode) {
          if (replaceScreen) {
            navigation.replace(SCREEN_COMPOSE, {
              title: newNote ? 'Compose' : 'Note',
              noteUuid,
            })
          } else {
            navigation.navigate(SCREEN_COMPOSE, {
              title: newNote ? 'Compose' : 'Note',
              noteUuid,
            })
          }
        }
      },
      [navigation, isInTabletMode],
    )

    const openNote = useCallback(
      async (noteUuid: SNNote['uuid'], replaceScreen = false) => {
        await application.getAppState().openEditor(noteUuid)
        openCompose(false, noteUuid, replaceScreen)
      },
      [application, openCompose],
    )

    const onNoteSelect = useCallback(
      async (noteUuid: SNNote['uuid']) => {
        const note = application.items.findItem<SNNote>(noteUuid)
        if (note) {
          if (note.protected && !application.hasProtectionSources()) {
            return navigation.navigate(SCREEN_VIEW_PROTECTED_NOTE, {
              onPressView: () => openNote(noteUuid, true),
            })
          }
          if (await application.authorizeNoteAccess(note)) {
            if (!isInTabletMode) {
              await openNote(noteUuid)
            } else {
              /**
               * @TODO: remove setTimeout after SNJS navigation feature
               * https://app.asana.com/0/1201653402817596/1202360754617865
               */
              setTimeout(async () => {
                await openNote(noteUuid)
              })
            }
          }
        }
      },
      [application, isInTabletMode, navigation, openNote],
    )

    useEffect(() => {
      const removeBlurScreenListener = navigation.addListener('blur', () => {
        if (includeProtectedStarted) {
          setIncludeProtectedStarted(false)
          setShouldFocusSearch(true)
        }
      })

      return removeBlurScreenListener
    }, [navigation, includeProtectedStarted])

    useEffect(() => {
      let mounted = true
      const removeEditorObserver = application.editorGroup.addActiveControllerChangeObserver(activeEditor => {
        if (mounted) {
          setSelectedNoteId(activeEditor?.note?.uuid)
        }
      })

      return () => {
        mounted = false
        removeEditorObserver && removeEditorObserver()
      }
    }, [application])

    /**
     * Note that reloading display options destroys the current index and rebuilds it,
     * so call sparingly. The runtime complexity of destroying and building
     * an index is roughly O(n^2).
     * There are optional parameters to force using the new values,
     * use when React is too slow when updating the state.
     */
    const reloadNotesDisplayOptions = useCallback(
      (
        searchFilter?: string,
        sortOptions?: {
          sortBy?: CollectionSortProperty
          sortReverse: boolean
        },
        includeProtected?: boolean,
        includeArchived?: boolean,
        includeTrashed?: boolean,
      ) => {
        const tag = application.getAppState().selectedTag
        const searchQuery =
          searchText || searchFilter
            ? {
                query: searchFilter?.toLowerCase() ?? searchText.toLowerCase(),
                includeProtectedNoteText: includeProtected ?? includeProtectedNoteText,
              }
            : undefined

        let applyFilters = false
        if (typeof searchFilter !== 'undefined') {
          applyFilters = searchFilter !== ''
        } else if (typeof searchText !== 'undefined') {
          applyFilters = searchText !== ''
        }

        application.items.setPrimaryItemDisplayOptions({
          sortBy: sortOptions?.sortBy ?? sortBy,
          sortDirection: sortOptions?.sortReverse ?? sortReverse ? 'asc' : 'dsc',
          tags: tag instanceof SNTag ? [tag] : [],
          views: tag instanceof SmartView ? [tag] : [],
          searchQuery: searchQuery,
          includeArchived: applyFilters && (includeArchived ?? includeArchivedNotes),
          includeTrashed: applyFilters && (includeTrashed ?? includeTrashedNotes),
        })
      },
      [
        application,
        includeArchivedNotes,
        includeProtectedNoteText,
        includeTrashedNotes,
        sortBy,
        sortReverse,
        searchText,
      ],
    )

    const toggleIncludeProtected = useCallback(async () => {
      const includeProtected = !includeProtectedNoteText
      let allowToggling: boolean | undefined = true

      if (includeProtected) {
        setIncludeProtectedStarted(true)
        allowToggling = await application.authorizeSearchingProtectedNotesText()
      }

      setIncludeProtectedStarted(false)

      if (allowToggling) {
        reloadNotesDisplayOptions(undefined, undefined, includeProtected)
        setIncludeProtectedNoteText(includeProtected)
      }
    }, [application, includeProtectedNoteText, reloadNotesDisplayOptions])

    const toggleIncludeArchived = useCallback(() => {
      const includeArchived = !includeArchivedNotes
      reloadNotesDisplayOptions(undefined, undefined, undefined, includeArchived)
      setIncludeArchivedNotes(includeArchived)
    }, [includeArchivedNotes, reloadNotesDisplayOptions])

    const toggleIncludeTrashed = useCallback(() => {
      const includeTrashed = !includeTrashedNotes
      reloadNotesDisplayOptions(undefined, undefined, undefined, undefined, includeTrashed)
      setIncludeTrashedNotes(includeTrashed)
    }, [includeTrashedNotes, reloadNotesDisplayOptions])

    const reloadSearchOptions = useCallback(() => {
      const protections = application.hasProtectionSources() && !application.hasUnprotectedAccessSession()

      if (protections !== protectionsEnabled.current) {
        protectionsEnabled.current = !!protections
        setIncludeProtectedNoteText(!protections)
      }

      const selectedTag = application.getAppState().selectedTag
      const options = [
        {
          label: 'Include Protected Contents',
          selected: includeProtectedNoteText,
          onPress: toggleIncludeProtected,
        },
      ]

      const isArchiveView = selectedTag instanceof SmartView && selectedTag.uuid === SystemViewId.ArchivedNotes
      const isTrashView = selectedTag instanceof SmartView && selectedTag.uuid === SystemViewId.TrashedNotes
      if (!isArchiveView && !isTrashView) {
        setSearchOptions([
          ...options,
          {
            label: 'Archived',
            selected: includeArchivedNotes,
            onPress: toggleIncludeArchived,
          },
          {
            label: 'Trashed',
            selected: includeTrashedNotes,
            onPress: toggleIncludeTrashed,
          },
        ])
      } else {
        setSearchOptions(options)
      }
    }, [
      application,
      includeProtectedNoteText,
      includeArchivedNotes,
      includeTrashedNotes,
      toggleIncludeProtected,
      toggleIncludeArchived,
      toggleIncludeTrashed,
    ])

    const getFirstSelectableNote = useCallback((newNotes: SNNote[]) => newNotes.find(note => !note.protected), [])

    const selectFirstNote = useCallback(
      (newNotes: SNNote[]) => {
        const note = getFirstSelectableNote(newNotes)
        if (note && !loading && !decrypting) {
          void onNoteSelect(note.uuid)
        }
      },
      [decrypting, getFirstSelectableNote, loading, onNoteSelect],
    )

    const selectNextOrCreateNew = useCallback(
      (newNotes: SNNote[]) => {
        const note = getFirstSelectableNote(newNotes)
        if (note) {
          void onNoteSelect(note.uuid)
        } else {
          application.getAppState().closeActiveEditor()
        }
      },
      [application, getFirstSelectableNote, onNoteSelect],
    )

    const reloadNotes = useCallback(
      (reselectNote?: boolean, tagChanged?: boolean, searchFilter?: string) => {
        const tag = application.getAppState().selectedTag

        if (!tag) {
          return
        }

        reloadSearchOptions()

        if (!haveDisplayOptions.current) {
          haveDisplayOptions.current = true
          reloadNotesDisplayOptions()
        }

        const newNotes = application.items.getDisplayableNotes()
        const renderedNotes: SNNote[] = newNotes

        setNotes(renderedNotes)
        reloadTitle(renderedNotes, searchFilter)

        if (!application.getAppState().isTabletDevice || !reselectNote) {
          return
        }

        if (tagChanged) {
          if (renderedNotes.length > 0) {
            selectFirstNote(renderedNotes)
          } else {
            application.getAppState().closeActiveEditor()
          }
        } else {
          const activeNote = application.getAppState().getActiveNoteController()?.note

          if (activeNote) {
            const isTrashView =
              application.getAppState().selectedTag instanceof SmartView &&
              application.getAppState().selectedTag.uuid === SystemViewId.TrashedNotes

            if (activeNote.trashed && !isTrashView) {
              selectNextOrCreateNew(renderedNotes)
            }
          } else {
            selectFirstNote(renderedNotes)
          }
        }
      },
      [
        application,
        reloadNotesDisplayOptions,
        reloadSearchOptions,
        reloadTitle,
        selectFirstNote,
        selectNextOrCreateNew,
      ],
    )

    const onNoteCreate = useCallback(async () => {
      const title = application.getAppState().isTabletDevice ? `Note ${notes.length + 1}` : undefined
      const noteView = await application.getAppState().createEditor(title)
      openCompose(true, noteView.note.uuid)
      reloadNotes(true)
    }, [application, notes.length, openCompose, reloadNotes])

    const reloadPreferences = useCallback(async () => {
      let newSortBy = application.getLocalPreferences().getValue(PrefKey.MobileSortNotesBy, CollectionSort.CreatedAt)

      if (newSortBy === CollectionSort.UpdatedAt || (newSortBy as string) === 'client_updated_at') {
        newSortBy = CollectionSort.UpdatedAt
      }
      let displayOptionsChanged = false
      const newSortReverse = application.getLocalPreferences().getValue(PrefKey.MobileSortNotesReverse, false)
      const newHidePreview = application.getLocalPreferences().getValue(PrefKey.MobileNotesHideNotePreview, false)
      const newHideDate = application.getLocalPreferences().getValue(PrefKey.MobileNotesHideDate, false)
      const newHideEditorIcon = application.getLocalPreferences().getValue(PrefKey.MobileNotesHideEditorIcon, false)

      if (sortBy !== newSortBy) {
        setSortBy(newSortBy)
        displayOptionsChanged = true
      }
      if (sortReverse !== newSortReverse) {
        setSortReverse(newSortReverse)
        displayOptionsChanged = true
      }
      if (hidePreviews !== newHidePreview) {
        setHidePreviews(newHidePreview)
        displayOptionsChanged = true
      }
      if (hideDates !== newHideDate) {
        setHideDates(newHideDate)
        displayOptionsChanged = true
      }
      if (hideEditorIcon !== newHideEditorIcon) {
        setHideEditorIcon(newHideEditorIcon)
        displayOptionsChanged = true
      }

      if (displayOptionsChanged) {
        reloadNotesDisplayOptions(undefined, {
          sortBy: newSortBy,
          sortReverse: newSortReverse,
        })
      }
      reloadNotes()
    }, [
      application,
      sortBy,
      sortReverse,
      hidePreviews,
      hideDates,
      hideEditorIcon,
      reloadNotes,
      reloadNotesDisplayOptions,
    ])

    const onRefresh = useCallback(() => {
      startRefreshing()
      void application.sync.sync()
    }, [application, startRefreshing])

    const onSearchChange = useCallback(
      (filter: string) => {
        reloadNotesDisplayOptions(filter)
        setSearchText(filter)
        reloadNotes(undefined, undefined, filter)
      },
      [reloadNotes, reloadNotesDisplayOptions],
    )

    useEffect(() => {
      const removeEventObserver = application?.addSingleEventObserver(ApplicationEvent.PreferencesChanged, async () => {
        await reloadPreferences()
      })

      return () => {
        removeEventObserver?.()
      }
    }, [application, reloadPreferences])

    useFocusEffect(
      useCallback(() => {
        void reloadPreferences()
      }, [reloadPreferences]),
    )

    useEffect(() => {
      const removeAppStateChangeHandler = application.getAppState().addStateChangeObserver(state => {
        if (state === AppStateType.TagChanged) {
          reloadNotesDisplayOptions()
          reloadNotes(true, true)
        }
        if (state === AppStateType.PreferencesChanged) {
          void reloadPreferences()
        }
      })

      const removeStreamNotes = application.streamItems([ContentType.Note], async () => {
        /** If a note changes, it will be queried against the existing filter;
         * we dont need to reload display options */
        reloadNotes(true)
      })

      const removeStreamTags = application.streamItems([ContentType.Tag], async () => {
        /** A tag could have changed its relationships, so we need to reload the filter */
        reloadNotesDisplayOptions()
        reloadNotes()
      })

      return () => {
        removeStreamNotes()
        removeStreamTags()
        removeAppStateChangeHandler()
      }
    }, [application, reloadNotes, reloadNotesDisplayOptions, reloadPreferences])

    return (
      <>
        <NoteList
          onRefresh={onRefresh}
          hasRefreshControl={signedIn}
          onPressItem={onNoteSelect}
          refreshing={refreshing}
          searchText={searchText}
          onSearchChange={onSearchChange}
          onSearchCancel={() => onSearchChange('')}
          notes={notes}
          sortType={sortBy}
          decrypting={decrypting}
          loading={loading}
          hidePreviews={hidePreviews}
          hideDates={hideDates}
          hideEditorIcon={hideEditorIcon}
          selectedNoteId={application.getAppState().isInTabletMode ? selectedNoteId : undefined}
          searchOptions={searchOptions}
          shouldFocusSearch={shouldFocusSearch}
          setShouldFocusSearch={setShouldFocusSearch}
        />
        <FAB
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore style prop does not exist in types
          style={application.getAppState().isInTabletMode ? { bottom: keyboardHeight } : undefined}
          buttonColor={theme.stylekitInfoColor}
          iconTextColor={theme.stylekitInfoContrastColor}
          onClickAction={onNoteCreate}
          visible={true}
          size={30}
          iconTextComponent={<StyledIcon testID="newNoteButton" name={ThemeService.nameForIcon(ICON_ADD)} />}
        />
      </>
    )
  },
)
