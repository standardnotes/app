import { ListableContentItem } from '@/Components/ContentListView/Types/ListableContentItem'
import { destroyAllObjectProperties } from '@/Utils'
import {
  ApplicationEvent,
  CollectionSort,
  ContentType,
  findInArray,
  NoteViewController,
  PrefKey,
  SmartView,
  SNNote,
  SNTag,
  SystemViewId,
  DisplayOptions,
  InternalEventBus,
  InternalEventHandlerInterface,
  InternalEventInterface,
  FileViewController,
  FileItem,
  WebAppEvent,
  NewNoteTitleFormat,
  useBoolean,
  ItemListControllerPersistableValue,
} from '@standardnotes/snjs'
import { action, computed, makeObservable, observable, reaction, runInAction } from 'mobx'
import { WebApplication } from '../../Application/Application'
import { WebDisplayOptions } from './WebDisplayOptions'
import { NavigationController } from '../Navigation/NavigationController'
import { CrossControllerEvent } from '../CrossControllerEvent'
import { SearchOptionsController } from '../SearchOptionsController'
import { SelectedItemsController } from '../SelectedItemsController'
import { NotesController } from '../NotesController'
import { formatDateAndTimeForNote } from '@/Utils/DateUtils'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import dayjs from 'dayjs'
import { LinkingController } from '../LinkingController'
import { AbstractViewController } from '../Abstract/AbstractViewController'
import { Persistable } from '../Abstract/Persistable'

const MinNoteCellHeight = 51.0
const DefaultListNumNotes = 20
const ElementIdSearchBar = 'search-bar'
const ElementIdScrollContainer = 'notes-scrollable'

enum ItemsReloadSource {
  ItemStream,
  SyncEvent,
  DisplayOptionsChange,
  Pagination,
  TagChange,
  UserTriggeredTagChange,
  FilterTextChange,
}

export class ItemListController
  extends AbstractViewController
  implements Persistable<ItemListControllerPersistableValue>, InternalEventHandlerInterface
{
  completedFullSync = false
  noteFilterText = ''
  notes: SNNote[] = []
  items: ListableContentItem[] = []
  notesToDisplay = 0
  pageSize = 0
  panelTitle = 'Notes'
  panelWidth = 0
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
      application.streamItems<SNNote>(ContentType.Note, () => {
        void this.reloadItems(ItemsReloadSource.ItemStream)
      }),
    )

    this.disposers.push(
      application.streamItems<SNTag>([ContentType.Tag], async ({ changed, inserted }) => {
        const tags = [...changed, ...inserted]

        const { didReloadItems } = await this.reloadDisplayPreferences()
        if (!didReloadItems) {
          /** A tag could have changed its relationships, so we need to reload the filter */
          this.reloadNotesDisplayOptions()
        }

        void this.reloadItems(ItemsReloadSource.ItemStream)

        if (this.navigationController.selected && findInArray(tags, 'uuid', this.navigationController.selected.uuid)) {
          /** Tag title could have changed */
          this.reloadPanelTitle()
        }
      }),
    )

    this.disposers.push(
      application.addEventObserver(async () => {
        void this.reloadDisplayPreferences()
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
      panelWidth: observable,
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

      hydrateFromPersistedValue: action,
    })

    window.onresize = () => {
      this.resetPagination(true)
    }
  }

  getPersistableValue = (): ItemListControllerPersistableValue => {
    return {
      displayOptions: this.displayOptions,
    }
  }

  hydrateFromPersistedValue = (state: ItemListControllerPersistableValue | undefined) => {
    if (!state) {
      return
    }
    if (state.displayOptions) {
      this.displayOptions = state.displayOptions
    }
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === CrossControllerEvent.TagChanged) {
      const payload = event.payload as { userTriggered: boolean }
      this.handleTagChange(payload.userTriggered)
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

    await this.application.itemControllerGroup.createItemController(note)

    this.linkingController.reloadAllLinks()

    await this.publishEventSync(CrossControllerEvent.ActiveEditorChanged)
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

    await this.application.itemControllerGroup.createItemController(file)

    this.linkingController.reloadAllLinks()
  }

  setCompletedFullSync = (completed: boolean) => {
    this.completedFullSync = completed
  }

  setShowDisplayOptionsMenu = (enabled: boolean) => {
    this.showDisplayOptionsMenu = enabled
  }

  get searchBarElement() {
    return document.getElementById(ElementIdSearchBar)
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

  private shouldSelectFirstItem = (itemsReloadSource: ItemsReloadSource) => {
    return (
      itemsReloadSource === ItemsReloadSource.UserTriggeredTagChange || !this.selectionController.selectedUuids.size
    )
  }

  private shouldCloseActiveItem = (activeItem: SNNote | FileItem | undefined) => {
    const isSearching = this.noteFilterText.length > 0
    const itemExistsInUpdatedResults = this.items.find((item) => item.uuid === activeItem?.uuid)

    return !itemExistsInUpdatedResults && !isSearching && this.navigationController.isInAnySystemView()
  }

  private shouldSelectNextItemOrCreateNewNote = (activeItem: SNNote | FileItem | undefined) => {
    const shouldShowTrashedNotes =
      this.navigationController.isInSystemView(SystemViewId.TrashedNotes) || this.searchOptionsController.includeTrashed

    const shouldShowArchivedNotes =
      this.navigationController.isInSystemView(SystemViewId.ArchivedNotes) ||
      this.searchOptionsController.includeArchived ||
      this.application.getPreference(PrefKey.NotesShowArchived, PrefDefaults[PrefKey.NotesShowArchived])

    return (activeItem?.trashed && !shouldShowTrashedNotes) || (activeItem?.archived && !shouldShowArchivedNotes)
  }

  private shouldSelectActiveItem = (activeItem: SNNote | FileItem | undefined) => {
    return activeItem && !this.selectionController.isItemSelected(activeItem)
  }

  private async recomputeSelectionAfterItemsReload(itemsReloadSource: ItemsReloadSource) {
    const activeController = this.getActiveItemController()

    if (this.shouldLeaveSelectionUnchanged(activeController)) {
      return
    }

    const activeItem = activeController?.item

    if (this.shouldCloseActiveItem(activeItem) && activeController) {
      this.closeItemController(activeController)
      this.selectionController.selectNextItem()
    } else if (this.shouldSelectActiveItem(activeItem) && activeItem) {
      await this.selectionController.selectItem(activeItem.uuid).catch(console.error)
    } else if (this.shouldSelectFirstItem(itemsReloadSource)) {
      await this.selectFirstItem()
    } else if (this.shouldSelectNextItemOrCreateNewNote(activeItem)) {
      await this.selectNextItemOrCreateNewNote()
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

  reloadDisplayPreferences = async (): Promise<{ didReloadItems: boolean }> => {
    const newDisplayOptions = {} as DisplayOptions
    const newWebDisplayOptions = {} as WebDisplayOptions
    const selectedTag = this.navigationController.selected

    let sortBy =
      selectedTag?.preferences?.sortBy ||
      this.application.getPreference(PrefKey.SortNotesBy, PrefDefaults[PrefKey.SortNotesBy])
    if (sortBy === CollectionSort.UpdatedAt || (sortBy as string) === 'client_updated_at') {
      sortBy = CollectionSort.UpdatedAt
    }
    newDisplayOptions.sortBy = sortBy

    newDisplayOptions.sortDirection =
      useBoolean(
        selectedTag?.preferences?.sortReverse,
        this.application.getPreference(PrefKey.SortNotesReverse, PrefDefaults[PrefKey.SortNotesReverse]),
      ) === false
        ? 'dsc'
        : 'asc'

    newDisplayOptions.includeArchived = useBoolean(
      selectedTag?.preferences?.showArchived,
      this.application.getPreference(PrefKey.NotesShowArchived, PrefDefaults[PrefKey.NotesShowArchived]),
    )

    newDisplayOptions.includeTrashed = useBoolean(
      selectedTag?.preferences?.showTrashed,
      this.application.getPreference(PrefKey.NotesShowTrashed, PrefDefaults[PrefKey.NotesShowTrashed]),
    )

    newDisplayOptions.includePinned = !useBoolean(
      selectedTag?.preferences?.hidePinned,
      this.application.getPreference(PrefKey.NotesHidePinned, PrefDefaults[PrefKey.NotesHidePinned]),
    )

    newDisplayOptions.includeProtected = !useBoolean(
      selectedTag?.preferences?.hideProtected,
      this.application.getPreference(PrefKey.NotesHideProtected, PrefDefaults[PrefKey.NotesHideProtected]),
    )

    newWebDisplayOptions.hideNotePreview = useBoolean(
      selectedTag?.preferences?.hideNotePreview,
      this.application.getPreference(PrefKey.NotesHideNotePreview, PrefDefaults[PrefKey.NotesHideNotePreview]),
    )

    newWebDisplayOptions.hideDate = useBoolean(
      selectedTag?.preferences?.hideDate,
      this.application.getPreference(PrefKey.NotesHideDate, PrefDefaults[PrefKey.NotesHideDate]),
    )

    newWebDisplayOptions.hideTags = useBoolean(
      selectedTag?.preferences?.hideTags,
      this.application.getPreference(PrefKey.NotesHideTags, PrefDefaults[PrefKey.NotesHideTags]),
    )

    newWebDisplayOptions.hideEditorIcon = useBoolean(
      selectedTag?.preferences?.hideEditorIcon,
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

    const newWidth = this.application.getPreference(PrefKey.NotesPanelWidth)
    if (newWidth && newWidth !== this.panelWidth) {
      this.panelWidth = newWidth
    }

    if (!displayOptionsChanged) {
      return { didReloadItems: false }
    }

    this.reloadNotesDisplayOptions()

    await this.reloadItems(ItemsReloadSource.DisplayOptionsChange)

    this.eventBus.publish({
      type: CrossControllerEvent.RequestValuePersistence,
      payload: undefined,
    })

    return { didReloadItems: true }
  }

  async createNewNoteController(title?: string) {
    const selectedTag = this.navigationController.selected

    const activeRegularTagUuid = selectedTag instanceof SNTag ? selectedTag.uuid : undefined

    await this.application.itemControllerGroup.createItemController({
      title,
      tag: activeRegularTagUuid,
    })
  }

  createNewNote = async () => {
    this.notesController.unselectNotes()

    if (this.navigationController.isInSmartView() && !this.navigationController.isInHomeView()) {
      await this.navigationController.selectHomeNavigationView()
    }

    const titleFormat =
      this.navigationController.selected?.preferences?.newNoteTitleFormat ||
      this.application.getPreference(PrefKey.NewNoteTitleFormat, PrefDefaults[PrefKey.NewNoteTitleFormat])

    let title = formatDateAndTimeForNote(new Date())

    if (titleFormat === NewNoteTitleFormat.CurrentNoteCount) {
      title = `Note ${this.notes.length + 1}`
    } else if (titleFormat === NewNoteTitleFormat.CustomFormat) {
      const customFormat =
        this.navigationController.selected?.preferences?.customNoteTitleFormat ||
        this.application.getPreference(PrefKey.CustomNoteTitleFormat, PrefDefaults[PrefKey.CustomNoteTitleFormat])
      title = dayjs().format(customFormat)
    } else if (titleFormat === NewNoteTitleFormat.Empty) {
      title = ''
    }

    if (this.isFiltering) {
      title = this.noteFilterText
    }

    await this.createNewNoteController(title)

    this.linkingController.reloadAllLinks()
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

    if (item) {
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
    this.application.itemControllerGroup.closeItemController(controller)
  }

  handleTagChange = (userTriggered: boolean) => {
    const activeNoteController = this.getActiveItemController()
    if (activeNoteController instanceof NoteViewController && activeNoteController.isTemplateNote) {
      this.closeItemController(activeNoteController)
    }

    this.resetScrollPosition()

    this.setShowDisplayOptionsMenu(false)

    this.setNoteFilterText('')

    this.application.getDesktopService()?.searchText()

    this.resetPagination()

    this.reloadNotesDisplayOptions()

    void this.reloadItems(userTriggered ? ItemsReloadSource.UserTriggeredTagChange : ItemsReloadSource.TagChange)

    void this.reloadDisplayPreferences()
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
