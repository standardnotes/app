import { ListableContentItem } from '@/Components/ContentListView/Types/ListableContentItem'
import { debounce, destroyAllObjectProperties, isMobileScreen } from '@/Utils'
import {
  ApplicationEvent,
  CollectionSort,
  ContentType,
  findInArray,
  PrefKey,
  SmartView,
  SNNote,
  SNTag,
  SystemViewId,
  InternalEventHandlerInterface,
  InternalEventInterface,
  FileItem,
  WebAppEvent,
  NewNoteTitleFormat,
  useBoolean,
  isTag,
  isFile,
  isSmartView,
  isSystemView,
  NotesAndFilesDisplayControllerOptions,
  InternalEventBusInterface,
  PrefDefaults,
  ItemManagerInterface,
  PreferenceServiceInterface,
  ChangeAndSaveItem,
  DesktopManagerInterface,
  UuidString,
  ProtectionsClientInterface,
  FullyResolvedApplicationOptions,
  Uuids,
  isNote,
  ChallengeReason,
  KeyboardModifier,
} from '@standardnotes/snjs'
import { action, computed, makeObservable, observable, reaction, runInAction } from 'mobx'
import { WebDisplayOptions } from './WebDisplayOptions'
import { NavigationController } from '../Navigation/NavigationController'
import { CrossControllerEvent } from '../CrossControllerEvent'
import { SearchOptionsController } from '../SearchOptionsController'
import { formatDateAndTimeForNote } from '@/Utils/DateUtils'

import { AbstractViewController } from '../Abstract/AbstractViewController'
import { log, LoggingDomain } from '@/Logging'
import { NoteViewController } from '@/Components/NoteView/Controller/NoteViewController'
import { FileViewController } from '@/Components/NoteView/Controller/FileViewController'
import { TemplateNoteViewAutofocusBehavior } from '@/Components/NoteView/Controller/TemplateNoteViewControllerOptions'
import { ItemsReloadSource } from './ItemsReloadSource'
import {
  IsNativeMobileWeb,
  KeyboardService,
  SelectionControllerPersistableValue,
  VaultDisplayServiceEvent,
  VaultDisplayServiceInterface,
} from '@standardnotes/ui-services'
import { getDayjsFormattedString } from '@/Utils/GetDayjsFormattedString'
import { ItemGroupController } from '@/Components/NoteView/Controller/ItemGroupController'
import { Persistable } from '../Abstract/Persistable'
import { PaneController } from '../PaneController/PaneController'
import { requestCloseAllOpenModalsAndPopovers } from '@/Utils/CloseOpenModalsAndPopovers'
import { PaneLayout } from '../PaneController/PaneLayout'

const MinNoteCellHeight = 51.0
const DefaultListNumNotes = 20
const ElementIdScrollContainer = 'notes-scrollable'

export class ItemListController
  extends AbstractViewController
  implements InternalEventHandlerInterface, Persistable<SelectionControllerPersistableValue>
{
  completedFullSync = false
  noteFilterText = ''
  notes: SNNote[] = []
  items: ListableContentItem[] = []
  notesToDisplay = 0
  pageSize = 0
  panelTitle = 'Notes'
  renderedItems: ListableContentItem[] = []
  searchSubmitted = false
  showDisplayOptionsMenu = false
  displayOptions: NotesAndFilesDisplayControllerOptions = {
    sortBy: CollectionSort.CreatedAt,
    sortDirection: 'dsc',
    includePinned: true,
    includeArchived: false,
    includeTrashed: false,
    includeProtected: true,
  }
  webDisplayOptions: WebDisplayOptions = {
    hideTags: true,
    hideDate: false,
    hideNotePreview: false,
    hideEditorIcon: false,
  }
  isTableViewEnabled = false
  private reloadItemsPromise?: Promise<unknown>

  lastSelectedItem: ListableContentItem | undefined
  selectedUuids: Set<UuidString> = observable(new Set<UuidString>())
  selectedItems: Record<UuidString, ListableContentItem> = {}

  isMultipleSelectionMode = false

  override deinit() {
    super.deinit()
    ;(this.noteFilterText as unknown) = undefined
    ;(this.notes as unknown) = undefined
    ;(this.renderedItems as unknown) = undefined
    ;(this.navigationController as unknown) = undefined
    ;(this.searchOptionsController as unknown) = undefined
    ;(window.onresize as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  constructor(
    private keyboardService: KeyboardService,
    private paneController: PaneController,
    private navigationController: NavigationController,
    private searchOptionsController: SearchOptionsController,
    private itemManager: ItemManagerInterface,
    private preferences: PreferenceServiceInterface,
    private itemControllerGroup: ItemGroupController,
    private vaultDisplayService: VaultDisplayServiceInterface,
    private desktopManager: DesktopManagerInterface | undefined,
    private protections: ProtectionsClientInterface,
    private options: FullyResolvedApplicationOptions,
    private _isNativeMobileWeb: IsNativeMobileWeb,
    private _changeAndSaveItem: ChangeAndSaveItem,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    makeObservable(this, {
      completedFullSync: observable,
      displayOptions: observable.struct,
      webDisplayOptions: observable.struct,
      noteFilterText: observable,
      notes: observable,
      notesToDisplay: observable,
      panelTitle: observable,
      items: observable,
      renderedItems: observable,
      showDisplayOptionsMenu: observable,

      reloadItems: action,
      reloadPanelTitle: action,
      reloadDisplayPreferences: action,
      resetPagination: action,
      setCompletedFullSync: action,
      setNoteFilterText: action,
      setShowDisplayOptionsMenu: action,
      onFilterEnter: action,
      handleFilterTextChanged: action,

      optionsSubtitle: computed,
      activeControllerItem: computed,

      selectedUuids: observable,
      selectedItems: observable,

      selectedItemsCount: computed,
      selectedFiles: computed,
      selectedFilesCount: computed,
      firstSelectedItem: computed,

      selectItem: action,
      setSelectedUuids: action,
      setSelectedItems: action,

      hydrateFromPersistedValue: action,

      isMultipleSelectionMode: observable,
      enableMultipleSelectionMode: action,
      cancelMultipleSelection: action,
    })

    eventBus.addEventHandler(this, CrossControllerEvent.TagChanged)
    eventBus.addEventHandler(this, CrossControllerEvent.ActiveEditorChanged)
    eventBus.addEventHandler(this, VaultDisplayServiceEvent.VaultDisplayOptionsChanged)

    this.resetPagination()

    this.disposers.push(
      itemManager.streamItems<SNNote>([ContentType.TYPES.Note, ContentType.TYPES.File], () => {
        void this.reloadItems(ItemsReloadSource.ItemStream)
      }),
    )

    this.disposers.push(
      itemManager.streamItems<SNTag>(
        [ContentType.TYPES.Tag, ContentType.TYPES.SmartView],
        async ({ changed, inserted }) => {
          const tags = [...changed, ...inserted]

          const { didReloadItems } = await this.reloadDisplayPreferences({ userTriggered: false })
          if (!didReloadItems) {
            /** A tag could have changed its relationships, so we need to reload the filter */
            this.reloadNotesDisplayOptions()
            void this.reloadItems(ItemsReloadSource.ItemStream)
          }

          if (
            this.navigationController.selected &&
            findInArray(tags, 'uuid', this.navigationController.selected.uuid)
          ) {
            /** Tag title could have changed */
            this.reloadPanelTitle()
          }
        },
      ),
    )

    eventBus.addEventHandler(this, ApplicationEvent.PreferencesChanged)
    eventBus.addEventHandler(this, ApplicationEvent.SignedIn)
    eventBus.addEventHandler(this, ApplicationEvent.CompletedFullSync)
    eventBus.addEventHandler(this, WebAppEvent.EditorDidFocus)

    this.disposers.push(
      reaction(
        () => [
          this.searchOptionsController.includeProtectedContents,
          this.searchOptionsController.includeArchived,
          this.searchOptionsController.includeTrashed,
        ],
        () => {
          this.reloadNotesDisplayOptions()
          void this.reloadItems(ItemsReloadSource.DisplayOptionsChange)
        },
      ),
    )

    this.disposers.push(
      reaction(
        () => this.selectedUuids,
        () => {
          eventBus.publish({
            type: CrossControllerEvent.RequestValuePersistence,
            payload: undefined,
          })
        },
      ),
    )

    this.disposers.push(
      this.itemManager.streamItems<SNNote | FileItem>(
        [ContentType.TYPES.Note, ContentType.TYPES.File],
        ({ changed, inserted, removed }) => {
          runInAction(() => {
            for (const removedItem of removed) {
              this.removeSelectedItem(removedItem.uuid)
            }

            for (const item of [...changed, ...inserted]) {
              if (this.selectedItems[item.uuid]) {
                this.selectedItems[item.uuid] = item
              }
            }
          })
        },
      ),
    )

    this.disposers.push(
      reaction(
        () => this.selectedItemsCount,
        (count, prevCount) => {
          const hasNoSelectedItem = count === 0
          const onlyOneSelectedItemAfterChange = prevCount > count && count === 1
          if (hasNoSelectedItem || onlyOneSelectedItemAfterChange) {
            this.cancelMultipleSelection()
          }
        },
      ),
    )

    window.onresize = debounce(() => {
      this.resetPagination(true)
    }, 100)
  }

  getPersistableValue = (): SelectionControllerPersistableValue => {
    return {
      selectedUuids: Array.from(this.selectedUuids),
    }
  }

  hydrateFromPersistedValue = (state: SelectionControllerPersistableValue | undefined): void => {
    if (!state) {
      return
    }

    if (!this.selectedUuids.size && state.selectedUuids.length > 0) {
      if (!this.options.allowNoteSelectionStatePersistence) {
        const items = this.itemManager.findItems(state.selectedUuids).filter((item) => !isNote(item))
        void this.selectUuids(Uuids(items))
      } else {
        void this.selectUuids(state.selectedUuids)
      }
    }
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case CrossControllerEvent.TagChanged: {
        const payload = event.payload as { userTriggered: boolean }
        await this.handleTagChange(payload.userTriggered)
        break
      }

      case CrossControllerEvent.ActiveEditorChanged: {
        await this.handleEditorChange()
        break
      }

      case VaultDisplayServiceEvent.VaultDisplayOptionsChanged: {
        void this.reloadItems(ItemsReloadSource.DisplayOptionsChange)
        break
      }

      case ApplicationEvent.PreferencesChanged: {
        void this.reloadDisplayPreferences({ userTriggered: false })
        break
      }

      case WebAppEvent.EditorDidFocus: {
        this.setShowDisplayOptionsMenu(false)
        break
      }

      case ApplicationEvent.SignedIn: {
        this.itemControllerGroup.closeAllItemControllers()
        void this.selectFirstItem()
        this.setCompletedFullSync(false)
        break
      }

      case ApplicationEvent.CompletedFullSync: {
        if (!this.completedFullSync) {
          void this.reloadItems(ItemsReloadSource.SyncEvent).then(() => {
            if (
              this.notes.length === 0 &&
              this.navigationController.selected instanceof SmartView &&
              this.navigationController.selected.uuid === SystemViewId.AllNotes &&
              this.noteFilterText === '' &&
              !this.getActiveItemController()
            ) {
              this.createPlaceholderNote()?.catch(console.error)
            }
          })
          this.setCompletedFullSync(true)
          break
        }
      }
    }
  }

  public get listLength() {
    return this.renderedItems.length
  }

  public getActiveItemController(): NoteViewController | FileViewController | undefined {
    return this.itemControllerGroup.activeItemViewController
  }

  public get activeControllerItem() {
    return this.getActiveItemController()?.item
  }

  async openNote(uuid: string): Promise<void> {
    if (this.activeControllerItem?.uuid === uuid) {
      return
    }

    const note = this.itemManager.findItem<SNNote>(uuid)
    if (!note) {
      console.warn('Tried accessing a non-existant note of UUID ' + uuid)
      return
    }

    await this.itemControllerGroup.createItemController({ note })

    await this.publishCrossControllerEventSync(CrossControllerEvent.ActiveEditorChanged)
  }

  async openFile(fileUuid: string): Promise<void> {
    if (this.getActiveItemController()?.item.uuid === fileUuid) {
      return
    }

    const file = this.itemManager.findItem<FileItem>(fileUuid)
    if (!file) {
      console.warn('Tried accessing a non-existant file of UUID ' + fileUuid)
      return
    }

    await this.itemControllerGroup.createItemController({ file })
  }

  setCompletedFullSync = (completed: boolean) => {
    this.completedFullSync = completed
  }

  setShowDisplayOptionsMenu = (enabled: boolean) => {
    this.showDisplayOptionsMenu = enabled
  }

  get isFiltering(): boolean {
    return !!this.noteFilterText && this.noteFilterText.length > 0
  }

  reloadPanelTitle = () => {
    let title = this.panelTitle

    if (this.isFiltering) {
      const resultCount = this.items.length
      title = `${resultCount} search results`
    } else if (this.navigationController.selected) {
      title = `${this.navigationController.selected.title}`
    }

    this.panelTitle = title
  }

  reloadItems = async (source: ItemsReloadSource): Promise<void> => {
    if (this.reloadItemsPromise) {
      await this.reloadItemsPromise
    }

    this.reloadItemsPromise = this.performReloadItems(source)

    await this.reloadItemsPromise
  }

  private async performReloadItems(source: ItemsReloadSource) {
    const tag = this.navigationController.selected
    if (!tag) {
      return
    }

    const notes = this.itemManager.getDisplayableNotes()

    const items = this.itemManager.getDisplayableNotesAndFiles()

    const renderedItems = items.slice(0, this.notesToDisplay)

    runInAction(() => {
      this.notes = notes
      this.items = items
      this.renderedItems = renderedItems
    })

    await this.recomputeSelectionAfterItemsReload(source)

    this.reloadPanelTitle()
  }

  private shouldLeaveSelectionUnchanged = (activeController: NoteViewController | FileViewController | undefined) => {
    return activeController instanceof NoteViewController && activeController.isTemplateNote
  }

  /**
   * In some cases we want to keep the selected item open even if it doesn't appear in results,
   * for example if you are inside tag Foo and remove tag Foo from the note, we want to keep the note open.
   */
  private shouldCloseActiveItem = (activeItem: SNNote | FileItem | undefined, source?: ItemsReloadSource) => {
    if (source === ItemsReloadSource.UserTriggeredTagChange) {
      log(LoggingDomain.Selection, 'shouldCloseActiveItem true due to ItemsReloadSource.UserTriggeredTagChange')
      return true
    }

    const activeItemExistsInUpdatedResults = this.items.find((item) => item.uuid === activeItem?.uuid)

    const closeBecauseActiveItemIsFileAndDoesntExistInUpdatedResults =
      activeItem && isFile(activeItem) && !activeItemExistsInUpdatedResults

    if (closeBecauseActiveItemIsFileAndDoesntExistInUpdatedResults) {
      log(LoggingDomain.Selection, 'shouldCloseActiveItem closeBecauseActiveItemIsFileAndDoesntExistInUpdatedResults')
      return true
    }

    const firstItemInNewResults = this.getFirstNonProtectedItem()

    const closePreviousItemWhenSwitchingToFilesBasedView =
      firstItemInNewResults && isFile(firstItemInNewResults) && !activeItemExistsInUpdatedResults

    if (closePreviousItemWhenSwitchingToFilesBasedView) {
      log(LoggingDomain.Selection, 'shouldCloseActiveItem closePreviousItemWhenSwitchingToFilesBasedView')
      return true
    }

    const isSearching = this.noteFilterText.length > 0

    const closeBecauseActiveItemDoesntExistInCurrentSystemView =
      !activeItemExistsInUpdatedResults && !isSearching && this.navigationController.isInAnySystemView()

    if (closeBecauseActiveItemDoesntExistInCurrentSystemView) {
      log(LoggingDomain.Selection, 'shouldCloseActiveItem closePreviousItemWhenSwitchingToFilesBasedView')
      return true
    }

    log(LoggingDomain.Selection, 'shouldCloseActiveItem false')
    return false
  }

  private shouldSelectNextItemOrCreateNewNote = (activeItem: SNNote | FileItem | undefined) => {
    const selectedView = this.navigationController.selected

    const isActiveItemTrashed = activeItem?.trashed
    const isActiveItemArchived = activeItem?.archived

    if (isActiveItemTrashed) {
      const selectedSmartViewShowsTrashed =
        selectedView instanceof SmartView && selectedView.predicate.keypathIncludesString('trashed')

      const shouldShowTrashedNotes =
        this.navigationController.isInSystemView(SystemViewId.TrashedNotes) ||
        this.searchOptionsController.includeTrashed ||
        selectedSmartViewShowsTrashed ||
        this.displayOptions.includeTrashed

      return !shouldShowTrashedNotes
    }

    if (isActiveItemArchived) {
      const selectedSmartViewShowsArchived =
        selectedView instanceof SmartView && selectedView.predicate.keypathIncludesString('archived')

      const shouldShowArchivedNotes =
        this.navigationController.isInSystemView(SystemViewId.ArchivedNotes) ||
        this.searchOptionsController.includeArchived ||
        selectedSmartViewShowsArchived ||
        this.displayOptions.includeArchived

      return !shouldShowArchivedNotes
    }

    return false
  }

  private shouldSelectActiveItem = (activeItem: SNNote | FileItem) => {
    return !this.isItemSelected(activeItem)
  }

  shouldSelectFirstItem = (itemsReloadSource: ItemsReloadSource) => {
    if (this._isNativeMobileWeb.execute().getValue()) {
      return false
    }

    const item = this.getFirstNonProtectedItem()
    if (item && isFile(item)) {
      return false
    }

    const selectedTag = this.navigationController.selected
    const isDailyEntry = selectedTag && isTag(selectedTag) && selectedTag.isDailyEntry
    if (isDailyEntry) {
      return false
    }

    const userChangedTag = itemsReloadSource === ItemsReloadSource.UserTriggeredTagChange
    const hasNoSelectedItem = !this.selectedUuids.size

    return userChangedTag || hasNoSelectedItem
  }

  private async recomputeSelectionAfterItemsReload(itemsReloadSource: ItemsReloadSource) {
    const activeController = this.getActiveItemController()

    if (this.shouldLeaveSelectionUnchanged(activeController)) {
      log(LoggingDomain.Selection, 'Leaving selection unchanged')
      return
    }

    const activeItem = activeController?.item

    if (activeController && activeItem && this.shouldCloseActiveItem(activeItem, itemsReloadSource)) {
      this.closeItemController(activeController)

      this.deselectItem(activeItem)

      if (this.shouldSelectFirstItem(itemsReloadSource)) {
        if (this.isTableViewEnabled && !isMobileScreen()) {
          return
        }

        log(LoggingDomain.Selection, 'Selecting next item after closing active one')
        this.selectNextItem({ userTriggered: false })
      }
    } else if (activeItem && this.shouldSelectActiveItem(activeItem)) {
      log(LoggingDomain.Selection, 'Selecting active item')
      await this.selectItem(activeItem.uuid).catch(console.error)
    } else if (this.shouldSelectFirstItem(itemsReloadSource)) {
      await this.selectFirstItem()
    } else if (this.shouldSelectNextItemOrCreateNewNote(activeItem)) {
      await this.selectNextItemOrCreateNewNote()
    } else {
      log(LoggingDomain.Selection, 'No selection change')
    }
  }

  reloadNotesDisplayOptions = () => {
    const tag = this.navigationController.selected

    const searchText = this.noteFilterText.toLowerCase()
    const isSearching = searchText.length
    let includeArchived: boolean
    let includeTrashed: boolean

    if (isSearching) {
      includeArchived = this.searchOptionsController.includeArchived
      includeTrashed = this.searchOptionsController.includeTrashed
    } else {
      includeArchived = this.displayOptions.includeArchived ?? false
      includeTrashed = this.displayOptions.includeTrashed ?? false
    }

    const criteria: NotesAndFilesDisplayControllerOptions = {
      sortBy: this.displayOptions.sortBy,
      sortDirection: this.displayOptions.sortDirection,
      tags: tag instanceof SNTag ? [tag] : [],
      views: tag instanceof SmartView ? [tag] : [],
      includeArchived,
      includeTrashed,
      includePinned: this.displayOptions.includePinned,
      includeProtected: this.displayOptions.includeProtected,
      searchQuery: {
        query: searchText,
        includeProtectedNoteText: this.searchOptionsController.includeProtectedContents,
      },
    }

    this.itemManager.setPrimaryItemDisplayOptions(criteria)
  }

  reloadDisplayPreferences = async ({
    userTriggered,
  }: {
    userTriggered: boolean
  }): Promise<{ didReloadItems: boolean }> => {
    const newDisplayOptions = {} as NotesAndFilesDisplayControllerOptions
    const newWebDisplayOptions = {} as WebDisplayOptions

    const selectedTag = this.navigationController.selected
    const isSystemTag = selectedTag && isSmartView(selectedTag) && isSystemView(selectedTag)
    const selectedTagPreferences = isSystemTag
      ? this.preferences.getValue(PrefKey.SystemViewPreferences)?.[selectedTag.uuid as SystemViewId]
      : selectedTag?.preferences

    this.isTableViewEnabled = Boolean(selectedTagPreferences?.useTableView)

    const currentSortBy = this.displayOptions.sortBy
    let sortBy =
      selectedTagPreferences?.sortBy ||
      this.preferences.getValue(PrefKey.SortNotesBy, PrefDefaults[PrefKey.SortNotesBy])
    if (sortBy === CollectionSort.UpdatedAt || (sortBy as string) === 'client_updated_at') {
      sortBy = CollectionSort.UpdatedAt
    }
    newDisplayOptions.sortBy = sortBy

    const currentSortDirection = this.displayOptions.sortDirection
    newDisplayOptions.sortDirection =
      useBoolean(
        selectedTagPreferences?.sortReverse,
        this.preferences.getValue(PrefKey.SortNotesReverse, PrefDefaults[PrefKey.SortNotesReverse]),
      ) === false
        ? 'dsc'
        : 'asc'

    newDisplayOptions.includeArchived = useBoolean(
      selectedTagPreferences?.showArchived,
      this.preferences.getValue(PrefKey.NotesShowArchived, PrefDefaults[PrefKey.NotesShowArchived]),
    )

    newDisplayOptions.includeTrashed = useBoolean(
      selectedTagPreferences?.showTrashed,
      this.preferences.getValue(PrefKey.NotesShowTrashed, PrefDefaults[PrefKey.NotesShowTrashed]),
    )

    newDisplayOptions.includePinned = !useBoolean(
      selectedTagPreferences?.hidePinned,
      this.preferences.getValue(PrefKey.NotesHidePinned, PrefDefaults[PrefKey.NotesHidePinned]),
    )

    newDisplayOptions.includeProtected = !useBoolean(
      selectedTagPreferences?.hideProtected,
      this.preferences.getValue(PrefKey.NotesHideProtected, PrefDefaults[PrefKey.NotesHideProtected]),
    )

    newWebDisplayOptions.hideNotePreview = useBoolean(
      selectedTagPreferences?.hideNotePreview,
      this.preferences.getValue(PrefKey.NotesHideNotePreview, PrefDefaults[PrefKey.NotesHideNotePreview]),
    )

    newWebDisplayOptions.hideDate = useBoolean(
      selectedTagPreferences?.hideDate,
      this.preferences.getValue(PrefKey.NotesHideDate, PrefDefaults[PrefKey.NotesHideDate]),
    )

    newWebDisplayOptions.hideTags = useBoolean(
      selectedTagPreferences?.hideTags,
      this.preferences.getValue(PrefKey.NotesHideTags, PrefDefaults[PrefKey.NotesHideTags]),
    )

    newWebDisplayOptions.hideEditorIcon = useBoolean(
      selectedTagPreferences?.hideEditorIcon,
      this.preferences.getValue(PrefKey.NotesHideEditorIcon, PrefDefaults[PrefKey.NotesHideEditorIcon]),
    )

    const displayOptionsChanged =
      newDisplayOptions.sortBy !== this.displayOptions.sortBy ||
      newDisplayOptions.sortDirection !== this.displayOptions.sortDirection ||
      newDisplayOptions.includePinned !== this.displayOptions.includePinned ||
      newDisplayOptions.includeArchived !== this.displayOptions.includeArchived ||
      newDisplayOptions.includeTrashed !== this.displayOptions.includeTrashed ||
      newDisplayOptions.includeProtected !== this.displayOptions.includeProtected ||
      newWebDisplayOptions.hideNotePreview !== this.webDisplayOptions.hideNotePreview ||
      newWebDisplayOptions.hideDate !== this.webDisplayOptions.hideDate ||
      newWebDisplayOptions.hideEditorIcon !== this.webDisplayOptions.hideEditorIcon ||
      newWebDisplayOptions.hideTags !== this.webDisplayOptions.hideTags

    this.displayOptions = newDisplayOptions
    this.webDisplayOptions = newWebDisplayOptions

    if (!displayOptionsChanged) {
      return { didReloadItems: false }
    }

    this.reloadNotesDisplayOptions()

    await this.reloadItems(
      userTriggered ? ItemsReloadSource.UserTriggeredTagChange : ItemsReloadSource.DisplayOptionsChange,
    )

    const didSortByChange = currentSortBy !== this.displayOptions.sortBy
    const didSortDirectionChange = currentSortDirection !== this.displayOptions.sortDirection
    const didSortPrefChange = didSortByChange || didSortDirectionChange

    if (didSortPrefChange && this.shouldSelectFirstItem(ItemsReloadSource.DisplayOptionsChange)) {
      await this.selectFirstItem()
    }

    return { didReloadItems: true }
  }

  async createNewNoteController(
    title?: string,
    createdAt?: Date,
    autofocusBehavior: TemplateNoteViewAutofocusBehavior = 'editor',
  ) {
    const selectedTag = this.navigationController.selected

    const activeRegularTagUuid = selectedTag instanceof SNTag ? selectedTag.uuid : undefined

    return this.itemControllerGroup.createItemController({
      templateOptions: {
        title,
        tag: activeRegularTagUuid,
        createdAt,
        autofocusBehavior,
        vault: this.vaultDisplayService.exclusivelyShownVault,
      },
    })
  }

  titleForNewNote = (createdAt?: Date) => {
    if (this.isFiltering) {
      return this.noteFilterText
    }

    const selectedTag = this.navigationController.selected
    const isSystemTag = selectedTag && isSmartView(selectedTag) && isSystemView(selectedTag)
    const selectedTagPreferences = isSystemTag
      ? this.preferences.getValue(PrefKey.SystemViewPreferences)?.[selectedTag.uuid as SystemViewId]
      : selectedTag?.preferences

    const titleFormat =
      selectedTagPreferences?.newNoteTitleFormat ||
      this.preferences.getValue(PrefKey.NewNoteTitleFormat, PrefDefaults[PrefKey.NewNoteTitleFormat])

    if (titleFormat === NewNoteTitleFormat.CurrentNoteCount) {
      return `Note ${this.notes.length + 1}`
    }

    if (titleFormat === NewNoteTitleFormat.CustomFormat) {
      const customFormat =
        this.navigationController.selected?.preferences?.customNoteTitleFormat ||
        this.preferences.getValue(PrefKey.CustomNoteTitleFormat, PrefDefaults[PrefKey.CustomNoteTitleFormat])

      try {
        return getDayjsFormattedString(createdAt, customFormat)
      } catch (error) {
        console.error(error)
        return formatDateAndTimeForNote(createdAt || new Date())
      }
    }

    if (titleFormat === NewNoteTitleFormat.Empty) {
      return ''
    }

    return formatDateAndTimeForNote(createdAt || new Date())
  }

  createNewNote = async (title?: string, createdAt?: Date, autofocusBehavior?: TemplateNoteViewAutofocusBehavior) => {
    void this.publishCrossControllerEventSync(CrossControllerEvent.UnselectAllNotes)

    if (this.navigationController.isInSmartView() && !this.navigationController.isInHomeView()) {
      await this.navigationController.selectHomeNavigationView()
    }

    const useTitle = title || this.titleForNewNote(createdAt)

    const controller = await this.createNewNoteController(useTitle, createdAt, autofocusBehavior)

    this.scrollToItem(controller.item)
  }

  createPlaceholderNote = () => {
    if (this.navigationController.isInSmartView() && !this.navigationController.isInHomeView()) {
      return
    }

    return this.createNewNote()
  }

  get optionsSubtitle(): string | undefined {
    if (!this.displayOptions.includePinned && !this.displayOptions.includeProtected) {
      return 'Excluding pinned and protected'
    }
    if (!this.displayOptions.includePinned) {
      return 'Excluding pinned'
    }
    if (!this.displayOptions.includeProtected) {
      return 'Excluding protected'
    }

    return undefined
  }

  paginate = () => {
    this.notesToDisplay += this.pageSize

    void this.reloadItems(ItemsReloadSource.Pagination)

    if (this.searchSubmitted) {
      this.desktopManager?.searchText(this.noteFilterText)
    }
  }

  resetPagination = (keepCurrentIfLarger = false) => {
    const clientHeight = document.documentElement.clientHeight
    this.pageSize = Math.ceil(clientHeight / MinNoteCellHeight)
    if (this.pageSize === 0) {
      this.pageSize = DefaultListNumNotes
    }
    if (keepCurrentIfLarger && this.notesToDisplay > this.pageSize) {
      return
    }
    this.notesToDisplay = this.pageSize
  }

  getFirstNonProtectedItem = () => {
    return this.items.find((item) => !item.protected)
  }

  get notesListScrollContainer() {
    return document.getElementById(ElementIdScrollContainer)
  }

  selectFirstItem = async () => {
    const item = this.getFirstNonProtectedItem()

    if (this.isTableViewEnabled && !isMobileScreen()) {
      return
    }

    if (item) {
      log(LoggingDomain.Selection, 'Selecting first item', item.uuid)

      await this.selectItemWithScrollHandling(item, {
        userTriggered: false,
        scrollIntoView: false,
      })

      this.resetScrollPosition()
    }
  }

  selectNextItemOrCreateNewNote = async () => {
    const item = this.getFirstNonProtectedItem()

    if (item) {
      log(LoggingDomain.Selection, 'selectNextItemOrCreateNewNote')
      await this.selectItemWithScrollHandling(item, {
        userTriggered: false,
        scrollIntoView: false,
      }).catch(console.error)
    } else {
      await this.createNewNote()
    }
  }

  setNoteFilterText = (text: string) => {
    if (text === this.noteFilterText) {
      return
    }

    this.noteFilterText = text
    this.handleFilterTextChanged()
  }

  handleEditorChange = async () => {
    const activeNote = this.itemControllerGroup.activeItemViewController?.item

    if (activeNote && activeNote.conflictOf) {
      void this._changeAndSaveItem.execute(activeNote, (mutator) => {
        mutator.conflictOf = undefined
      })
    }

    if (this.isFiltering) {
      this.desktopManager?.searchText(this.noteFilterText)
    }
  }

  resetScrollPosition = () => {
    if (this.notesListScrollContainer) {
      this.notesListScrollContainer.scrollTop = 0
      this.notesListScrollContainer.scrollLeft = 0
    }
  }

  private closeItemController(controller: NoteViewController | FileViewController): void {
    log(LoggingDomain.Selection, 'Closing item controller', controller.runtimeId)
    this.itemControllerGroup.closeItemController(controller)
  }

  handleTagChange = async (userTriggered: boolean) => {
    const activeNoteController = this.getActiveItemController()
    if (activeNoteController instanceof NoteViewController && activeNoteController.isTemplateNote) {
      this.closeItemController(activeNoteController)
    }

    this.resetScrollPosition()

    this.setShowDisplayOptionsMenu(false)

    this.setNoteFilterText('')

    this.desktopManager?.searchText()

    this.resetPagination()

    const { didReloadItems } = await this.reloadDisplayPreferences({ userTriggered })

    if (!didReloadItems) {
      this.reloadNotesDisplayOptions()
      void this.reloadItems(userTriggered ? ItemsReloadSource.UserTriggeredTagChange : ItemsReloadSource.TagChange)
    }
  }

  onFilterEnter = () => {
    /**
     * For Desktop, performing a search right away causes
     * input to lose focus. We wait until user explicity hits
     * enter before highlighting desktop search results.
     */
    this.searchSubmitted = true

    this.desktopManager?.searchText(this.noteFilterText)
  }

  get isCurrentNoteTemplate(): boolean {
    const controller = this.getActiveItemController()

    if (!controller) {
      return false
    }

    return controller instanceof NoteViewController && controller.isTemplateNote
  }

  public async insertCurrentIfTemplate(): Promise<void> {
    const controller = this.getActiveItemController()

    if (!controller) {
      return
    }

    if (controller instanceof NoteViewController && controller.isTemplateNote) {
      await controller.insertTemplatedNote()
    }
  }

  handleFilterTextChanged = () => {
    if (this.searchSubmitted) {
      this.searchSubmitted = false
    }

    this.reloadNotesDisplayOptions()

    void this.reloadItems(ItemsReloadSource.FilterTextChange)
  }

  clearFilterText = () => {
    this.setNoteFilterText('')
    this.onFilterEnter()
    this.handleFilterTextChanged()
    this.resetPagination()
  }

  get selectedItemsCount(): number {
    return Object.keys(this.selectedItems).length
  }

  get selectedFiles(): FileItem[] {
    return this.getFilteredSelectedItems<FileItem>(ContentType.TYPES.File)
  }

  get selectedFilesCount(): number {
    return this.selectedFiles.length
  }

  get firstSelectedItem() {
    return Object.values(this.selectedItems)[0]
  }

  getSelectedItems = () => {
    const uuids = Array.from(this.selectedUuids)
    return uuids.map((uuid) => this.itemManager.findSureItem<SNNote | FileItem>(uuid)).filter((item) => !!item)
  }

  getFilteredSelectedItems = <T extends ListableContentItem = ListableContentItem>(contentType?: string): T[] => {
    return Object.values(this.selectedItems).filter((item) => {
      return !contentType ? true : item.content_type === contentType
    }) as T[]
  }

  setSelectedItems = () => {
    this.selectedItems = Object.fromEntries(this.getSelectedItems().map((item) => [item.uuid, item]))
  }

  setSelectedUuids = (selectedUuids: Set<UuidString>) => {
    log(LoggingDomain.Selection, 'Setting selected uuids', selectedUuids)
    this.selectedUuids = new Set(selectedUuids)
    this.setSelectedItems()
  }

  private removeSelectedItem = (uuid: UuidString) => {
    this.selectedUuids.delete(uuid)
    this.setSelectedUuids(this.selectedUuids)
    delete this.selectedItems[uuid]
  }

  public deselectItem = (item: { uuid: ListableContentItem['uuid'] }): void => {
    log(LoggingDomain.Selection, 'Deselecting item', item.uuid)
    this.removeSelectedItem(item.uuid)

    if (item.uuid === this.lastSelectedItem?.uuid) {
      this.lastSelectedItem = undefined
    }
  }

  public isItemSelected = (item: ListableContentItem): boolean => {
    return this.selectedUuids.has(item.uuid)
  }

  private selectItemsRange = async ({
    selectedItem,
    startingIndex,
    endingIndex,
  }: {
    selectedItem?: ListableContentItem
    startingIndex?: number
    endingIndex?: number
  }): Promise<void> => {
    const items = this.renderedItems

    const lastSelectedItemIndex = startingIndex ?? items.findIndex((item) => item.uuid == this.lastSelectedItem?.uuid)
    const selectedItemIndex = endingIndex ?? items.findIndex((item) => item.uuid == selectedItem?.uuid)

    let itemsToSelect = []
    if (selectedItemIndex > lastSelectedItemIndex) {
      itemsToSelect = items.slice(lastSelectedItemIndex, selectedItemIndex + 1)
    } else {
      itemsToSelect = items.slice(selectedItemIndex, lastSelectedItemIndex + 1)
    }

    const authorizedItems = await this.protections.authorizeProtectedActionForItems(
      itemsToSelect,
      ChallengeReason.SelectProtectedNote,
    )

    for (const item of authorizedItems) {
      runInAction(() => {
        this.setSelectedUuids(this.selectedUuids.add(item.uuid))
        this.lastSelectedItem = item
        if (this.selectedItemsCount > 1 && !this.isMultipleSelectionMode) {
          this.enableMultipleSelectionMode()
        }
      })
    }
  }

  cancelMultipleSelection = () => {
    this.keyboardService.cancelAllKeyboardModifiers()

    this.isMultipleSelectionMode = false

    const firstSelectedItem = this.firstSelectedItem

    if (firstSelectedItem) {
      this.replaceSelection(firstSelectedItem)
    } else {
      this.deselectAll()
    }
  }

  replaceSelection = (item: ListableContentItem): void => {
    this.deselectAll()
    runInAction(() => this.setSelectedUuids(this.selectedUuids.add(item.uuid)))

    this.lastSelectedItem = item
  }

  selectAll = () => {
    const allItems = this.items.filter((item) => !item.protected)
    const lastItem = allItems[allItems.length - 1]
    this.setSelectedUuids(new Set(Uuids(allItems)))
    this.lastSelectedItem = lastItem
    this.enableMultipleSelectionMode()
  }

  deselectAll = (): void => {
    this.selectedUuids.clear()
    this.setSelectedUuids(this.selectedUuids)

    this.lastSelectedItem = undefined
  }

  openSingleSelectedItem = async ({ userTriggered } = { userTriggered: true }) => {
    if (this.selectedItemsCount === 1) {
      const item = this.firstSelectedItem

      if (item.content_type === ContentType.TYPES.Note) {
        await this.openNote(item.uuid)
      } else if (item.content_type === ContentType.TYPES.File) {
        await this.openFile(item.uuid)
      }

      if (!this.paneController.isInMobileView || userTriggered) {
        void this.paneController.setPaneLayout(PaneLayout.Editing)
      }

      if (this.paneController.isInMobileView && userTriggered) {
        requestCloseAllOpenModalsAndPopovers()
      }
    }
  }

  enableMultipleSelectionMode = () => {
    this.isMultipleSelectionMode = true
  }

  selectItem = async (
    uuid: UuidString,
    userTriggered?: boolean,
  ): Promise<{
    didSelect: boolean
  }> => {
    const item = this.itemManager.findItem<ListableContentItem>(uuid)

    if (!item) {
      return {
        didSelect: false,
      }
    }

    log(LoggingDomain.Selection, 'Select item', item.uuid)

    const hasShift = this.keyboardService.activeModifiers.has(KeyboardModifier.Shift)
    const hasMoreThanOneSelected = this.selectedItemsCount > 1
    const isAuthorizedForAccess = await this.protections.authorizeItemAccess(item)

    if (userTriggered && hasShift && !isMobileScreen()) {
      await this.selectItemsRange({ selectedItem: item })
    } else if (userTriggered && this.isMultipleSelectionMode) {
      if (this.selectedUuids.has(uuid) && hasMoreThanOneSelected) {
        this.removeSelectedItem(uuid)
      } else if (isAuthorizedForAccess) {
        this.selectedUuids.add(uuid)
        this.setSelectedUuids(this.selectedUuids)
        this.lastSelectedItem = item
      }
    } else {
      const shouldSelectNote = hasMoreThanOneSelected || !this.selectedUuids.has(uuid)
      if (shouldSelectNote && isAuthorizedForAccess) {
        this.replaceSelection(item)
        await this.openSingleSelectedItem({ userTriggered: userTriggered ?? false })
      }
    }

    return {
      didSelect: this.selectedUuids.has(uuid),
    }
  }

  selectItemWithScrollHandling = async (
    item: {
      uuid: ListableContentItem['uuid']
    },
    { userTriggered = false, scrollIntoView = true, animated = true },
  ): Promise<void> => {
    const { didSelect } = await this.selectItem(item.uuid, userTriggered)

    const avoidMobileScrollingDueToIncompatibilityWithPaneAnimations = isMobileScreen()

    if (didSelect && scrollIntoView && !avoidMobileScrollingDueToIncompatibilityWithPaneAnimations) {
      this.scrollToItem(item, animated)
    }
  }

  scrollToItem = (item: { uuid: ListableContentItem['uuid'] }, animated = true): void => {
    const itemElement = document.getElementById(item.uuid)
    itemElement?.scrollIntoView({
      behavior: animated ? 'smooth' : 'auto',
    })
  }

  selectUuids = async (uuids: UuidString[], userTriggered = false) => {
    const itemsForUuids = this.itemManager.findItems(uuids).filter((item) => !isFile(item))

    if (itemsForUuids.length < 1) {
      return
    }

    if (!userTriggered && itemsForUuids.some((item) => item.protected && isFile(item))) {
      return
    }

    this.setSelectedUuids(new Set(Uuids(itemsForUuids)))

    if (itemsForUuids.length === 1) {
      void this.openSingleSelectedItem({ userTriggered })
    }
  }

  selectNextItem = ({ userTriggered } = { userTriggered: true }) => {
    const displayableItems = this.items

    const currentIndex = displayableItems.findIndex((candidate) => {
      return candidate.uuid === this.lastSelectedItem?.uuid
    })

    let nextIndex = currentIndex + 1

    while (nextIndex < displayableItems.length) {
      const nextItem = displayableItems[nextIndex]

      nextIndex++

      if (nextItem.protected) {
        continue
      }

      this.selectItemWithScrollHandling(nextItem, { userTriggered }).catch(console.error)

      const nextNoteElement = document.getElementById(nextItem.uuid)

      nextNoteElement?.focus()

      return
    }
  }

  selectPreviousItem = () => {
    const displayableItems = this.items

    if (!this.lastSelectedItem) {
      return
    }

    const currentIndex = displayableItems.indexOf(this.lastSelectedItem)

    let previousIndex = currentIndex - 1

    while (previousIndex >= 0) {
      const previousItem = displayableItems[previousIndex]

      previousIndex--

      if (previousItem.protected) {
        continue
      }

      this.selectItemWithScrollHandling(previousItem, { userTriggered: true }).catch(console.error)

      const previousNoteElement = document.getElementById(previousItem.uuid)

      previousNoteElement?.focus()

      return
    }
  }
}
