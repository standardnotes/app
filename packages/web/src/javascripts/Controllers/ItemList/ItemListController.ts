import { ListableContentItem } from '@/Components/ContentListView/Types/ListableContentItem'
import { destroyAllObjectProperties, isMobileScreen } from '@/Utils'
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
  DisplayOptions,
  InternalEventBus,
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
} from '@standardnotes/snjs'
import { action, computed, makeObservable, observable, reaction, runInAction } from 'mobx'
import { WebApplication } from '../../Application/WebApplication'
import { WebDisplayOptions } from './WebDisplayOptions'
import { NavigationController } from '../Navigation/NavigationController'
import { CrossControllerEvent } from '../CrossControllerEvent'
import { SearchOptionsController } from '../SearchOptionsController'
import { SelectedItemsController } from '../SelectedItemsController'
import { NotesController } from '../NotesController/NotesController'
import { formatDateAndTimeForNote } from '@/Utils/DateUtils'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import dayjs from 'dayjs'
import dayjsAdvancedFormat from 'dayjs/plugin/advancedFormat'
dayjs.extend(dayjsAdvancedFormat)
import { LinkingController } from '../LinkingController'
import { AbstractViewController } from '../Abstract/AbstractViewController'
import { log, LoggingDomain } from '@/Logging'
import { NoteViewController } from '@/Components/NoteView/Controller/NoteViewController'
import { FileViewController } from '@/Components/NoteView/Controller/FileViewController'
import { TemplateNoteViewAutofocusBehavior } from '@/Components/NoteView/Controller/TemplateNoteViewControllerOptions'
import { ItemsReloadSource } from './ItemsReloadSource'

const MinNoteCellHeight = 51.0
const DefaultListNumNotes = 20
const ElementIdScrollContainer = 'notes-scrollable'

export class ItemListController extends AbstractViewController implements InternalEventHandlerInterface {
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
  displayOptions: DisplayOptions = {
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

  override deinit() {
    super.deinit()
    ;(this.noteFilterText as unknown) = undefined
    ;(this.notes as unknown) = undefined
    ;(this.renderedItems as unknown) = undefined
    ;(this.navigationController as unknown) = undefined
    ;(this.searchOptionsController as unknown) = undefined
    ;(this.selectionController as unknown) = undefined
    ;(this.notesController as unknown) = undefined
    ;(window.onresize as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  constructor(
    application: WebApplication,
    private navigationController: NavigationController,
    private searchOptionsController: SearchOptionsController,
    private selectionController: SelectedItemsController,
    private notesController: NotesController,
    private linkingController: LinkingController,
    eventBus: InternalEventBus,
  ) {
    super(application, eventBus)

    eventBus.addEventHandler(this, CrossControllerEvent.TagChanged)
    eventBus.addEventHandler(this, CrossControllerEvent.ActiveEditorChanged)

    this.resetPagination()

    this.disposers.push(
      application.streamItems<SNNote>([ContentType.Note, ContentType.File], () => {
        void this.reloadItems(ItemsReloadSource.ItemStream)
      }),
    )

    this.disposers.push(
      application.streamItems<SNTag>([ContentType.Tag, ContentType.SmartView], async ({ changed, inserted }) => {
        const tags = [...changed, ...inserted]

        const { didReloadItems } = await this.reloadDisplayPreferences({ userTriggered: false })
        if (!didReloadItems) {
          /** A tag could have changed its relationships, so we need to reload the filter */
          this.reloadNotesDisplayOptions()
          void this.reloadItems(ItemsReloadSource.ItemStream)
        }

        if (this.navigationController.selected && findInArray(tags, 'uuid', this.navigationController.selected.uuid)) {
          /** Tag title could have changed */
          this.reloadPanelTitle()
        }
      }),
    )

    this.disposers.push(
      application.addEventObserver(async () => {
        void this.reloadDisplayPreferences({ userTriggered: false })
      }, ApplicationEvent.PreferencesChanged),
    )

    this.disposers.push(
      application.addEventObserver(async () => {
        this.application.itemControllerGroup.closeAllItemControllers()
        void this.selectFirstItem()
        this.setCompletedFullSync(false)
      }, ApplicationEvent.SignedIn),
    )

    this.disposers.push(
      application.addEventObserver(async () => {
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
        }
      }, ApplicationEvent.CompletedFullSync),
    )

    this.disposers.push(
      application.addWebEventObserver((webEvent) => {
        if (webEvent === WebAppEvent.EditorFocused) {
          this.setShowDisplayOptionsMenu(false)
        }
      }),
    )

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
    })

    window.onresize = () => {
      this.resetPagination(true)
    }
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === CrossControllerEvent.TagChanged) {
      const payload = event.payload as { userTriggered: boolean }
      await this.handleTagChange(payload.userTriggered)
    } else if (event.type === CrossControllerEvent.ActiveEditorChanged) {
      this.handleEditorChange().catch(console.error)
    }
  }

  public get listLength() {
    return this.renderedItems.length
  }

  public getActiveItemController(): NoteViewController | FileViewController | undefined {
    return this.application.itemControllerGroup.activeItemViewController
  }

  public get activeControllerItem() {
    return this.getActiveItemController()?.item
  }

  async openNote(uuid: string): Promise<void> {
    if (this.activeControllerItem?.uuid === uuid) {
      return
    }

    const note = this.application.items.findItem<SNNote>(uuid)
    if (!note) {
      console.warn('Tried accessing a non-existant note of UUID ' + uuid)
      return
    }

    await this.application.itemControllerGroup.createItemController({ note })

    await this.publishCrossControllerEventSync(CrossControllerEvent.ActiveEditorChanged)
  }

  async openFile(fileUuid: string): Promise<void> {
    if (this.getActiveItemController()?.item.uuid === fileUuid) {
      return
    }

    const file = this.application.items.findItem<FileItem>(fileUuid)
    if (!file) {
      console.warn('Tried accessing a non-existant file of UUID ' + fileUuid)
      return
    }

    await this.application.itemControllerGroup.createItemController({ file })
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

    const notes = this.application.items.getDisplayableNotes()

    const items = this.application.items.getDisplayableNotesAndFiles()

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
    const hasMultipleItemsSelected = this.selectionController.selectedItemsCount >= 2

    return (
      hasMultipleItemsSelected || (activeController instanceof NoteViewController && activeController.isTemplateNote)
    )
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
    return !this.selectionController.isItemSelected(activeItem)
  }

  shouldSelectFirstItem = (itemsReloadSource: ItemsReloadSource) => {
    if (this.application.isNativeMobileWeb()) {
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
    const hasNoSelectedItem = !this.selectionController.selectedUuids.size

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

      this.selectionController.deselectItem(activeItem)

      if (this.shouldSelectFirstItem(itemsReloadSource)) {
        if (this.isTableViewEnabled && !isMobileScreen()) {
          return
        }

        log(LoggingDomain.Selection, 'Selecting next item after closing active one')
        this.selectionController.selectNextItem({ userTriggered: false })
      }
    } else if (activeItem && this.shouldSelectActiveItem(activeItem)) {
      log(LoggingDomain.Selection, 'Selecting active item')
      await this.selectionController.selectItem(activeItem.uuid).catch(console.error)
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

    const criteria: DisplayOptions = {
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

    this.application.items.setPrimaryItemDisplayOptions(criteria)
  }

  reloadDisplayPreferences = async ({
    userTriggered,
  }: {
    userTriggered: boolean
  }): Promise<{ didReloadItems: boolean }> => {
    const newDisplayOptions = {} as DisplayOptions
    const newWebDisplayOptions = {} as WebDisplayOptions
    const selectedTag = this.navigationController.selected
    const isSystemTag = selectedTag && isSmartView(selectedTag) && isSystemView(selectedTag)
    const selectedTagPreferences = isSystemTag
      ? this.application.getPreference(PrefKey.SystemViewPreferences)?.[selectedTag.uuid as SystemViewId]
      : selectedTag?.preferences

    this.isTableViewEnabled = Boolean(selectedTagPreferences?.useTableView)

    const currentSortBy = this.displayOptions.sortBy
    let sortBy =
      selectedTagPreferences?.sortBy ||
      this.application.getPreference(PrefKey.SortNotesBy, PrefDefaults[PrefKey.SortNotesBy])
    if (sortBy === CollectionSort.UpdatedAt || (sortBy as string) === 'client_updated_at') {
      sortBy = CollectionSort.UpdatedAt
    }
    newDisplayOptions.sortBy = sortBy

    const currentSortDirection = this.displayOptions.sortDirection
    newDisplayOptions.sortDirection =
      useBoolean(
        selectedTagPreferences?.sortReverse,
        this.application.getPreference(PrefKey.SortNotesReverse, PrefDefaults[PrefKey.SortNotesReverse]),
      ) === false
        ? 'dsc'
        : 'asc'

    newDisplayOptions.includeArchived = useBoolean(
      selectedTagPreferences?.showArchived,
      this.application.getPreference(PrefKey.NotesShowArchived, PrefDefaults[PrefKey.NotesShowArchived]),
    )

    newDisplayOptions.includeTrashed = useBoolean(
      selectedTagPreferences?.showTrashed,
      this.application.getPreference(PrefKey.NotesShowTrashed, PrefDefaults[PrefKey.NotesShowTrashed]),
    )

    newDisplayOptions.includePinned = !useBoolean(
      selectedTagPreferences?.hidePinned,
      this.application.getPreference(PrefKey.NotesHidePinned, PrefDefaults[PrefKey.NotesHidePinned]),
    )

    newDisplayOptions.includeProtected = !useBoolean(
      selectedTagPreferences?.hideProtected,
      this.application.getPreference(PrefKey.NotesHideProtected, PrefDefaults[PrefKey.NotesHideProtected]),
    )

    newWebDisplayOptions.hideNotePreview = useBoolean(
      selectedTagPreferences?.hideNotePreview,
      this.application.getPreference(PrefKey.NotesHideNotePreview, PrefDefaults[PrefKey.NotesHideNotePreview]),
    )

    newWebDisplayOptions.hideDate = useBoolean(
      selectedTagPreferences?.hideDate,
      this.application.getPreference(PrefKey.NotesHideDate, PrefDefaults[PrefKey.NotesHideDate]),
    )

    newWebDisplayOptions.hideTags = useBoolean(
      selectedTagPreferences?.hideTags,
      this.application.getPreference(PrefKey.NotesHideTags, PrefDefaults[PrefKey.NotesHideTags]),
    )

    newWebDisplayOptions.hideEditorIcon = useBoolean(
      selectedTagPreferences?.hideEditorIcon,
      this.application.getPreference(PrefKey.NotesHideEditorIcon, PrefDefaults[PrefKey.NotesHideEditorIcon]),
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

    return this.application.itemControllerGroup.createItemController({
      templateOptions: {
        title,
        tag: activeRegularTagUuid,
        createdAt,
        autofocusBehavior,
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
      ? this.application.getPreference(PrefKey.SystemViewPreferences)?.[selectedTag.uuid as SystemViewId]
      : selectedTag?.preferences

    const titleFormat =
      selectedTagPreferences?.newNoteTitleFormat ||
      this.application.getPreference(PrefKey.NewNoteTitleFormat, PrefDefaults[PrefKey.NewNoteTitleFormat])

    if (titleFormat === NewNoteTitleFormat.CurrentNoteCount) {
      return `Note ${this.notes.length + 1}`
    }

    if (titleFormat === NewNoteTitleFormat.CustomFormat) {
      const customFormat =
        this.navigationController.selected?.preferences?.customNoteTitleFormat ||
        this.application.getPreference(PrefKey.CustomNoteTitleFormat, PrefDefaults[PrefKey.CustomNoteTitleFormat])

      return dayjs(createdAt).format(customFormat)
    }

    if (titleFormat === NewNoteTitleFormat.Empty) {
      return ''
    }

    return formatDateAndTimeForNote(createdAt || new Date())
  }

  createNewNote = async (title?: string, createdAt?: Date, autofocusBehavior?: TemplateNoteViewAutofocusBehavior) => {
    this.notesController.unselectNotes()

    if (this.navigationController.isInSmartView() && !this.navigationController.isInHomeView()) {
      await this.navigationController.selectHomeNavigationView()
    }

    const useTitle = title || this.titleForNewNote(createdAt)

    const controller = await this.createNewNoteController(useTitle, createdAt, autofocusBehavior)

    this.selectionController.scrollToItem(controller.item)
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
      this.application.getDesktopService()?.searchText(this.noteFilterText)
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

      await this.selectionController.selectItemWithScrollHandling(item, {
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
      await this.selectionController
        .selectItemWithScrollHandling(item, {
          userTriggered: false,
          scrollIntoView: false,
        })
        .catch(console.error)
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
    const activeNote = this.application.itemControllerGroup.activeItemViewController?.item

    if (activeNote && activeNote.conflictOf) {
      this.application.mutator
        .changeAndSaveItem(activeNote, (mutator) => {
          mutator.conflictOf = undefined
        })
        .catch(console.error)
    }

    if (this.isFiltering) {
      this.application.getDesktopService()?.searchText(this.noteFilterText)
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
    this.application.itemControllerGroup.closeItemController(controller)
  }

  handleTagChange = async (userTriggered: boolean) => {
    const activeNoteController = this.getActiveItemController()
    if (activeNoteController instanceof NoteViewController && activeNoteController.isTemplateNote) {
      this.closeItemController(activeNoteController)
    }

    this.resetScrollPosition()

    this.setShowDisplayOptionsMenu(false)

    this.setNoteFilterText('')

    this.application.getDesktopService()?.searchText()

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

    this.application.getDesktopService()?.searchText(this.noteFilterText)
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
}
