import {
  confirmDialog,
  CREATE_NEW_TAG_COMMAND,
  KeyboardService,
  NavigationControllerPersistableValue,
  VaultDisplayService,
  VaultDisplayServiceEvent,
} from '@standardnotes/ui-services'
import { STRING_DELETE_TAG } from '@/Constants/Strings'
import { SMART_TAGS_FEATURE_NAME } from '@/Constants/Constants'
import {
  ContentType,
  SmartView,
  SNTag,
  TagMutator,
  UuidString,
  isSystemView,
  FindItem,
  SystemViewId,
  InternalEventPublishStrategy,
  VectorIconNameOrEmoji,
  isTag,
  PrefKey,
  InternalEventBusInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
  ItemManagerInterface,
  SyncServiceInterface,
  MutatorClientInterface,
  AlertService,
  PreferenceServiceInterface,
  ChangeAndSaveItem,
} from '@standardnotes/snjs'
import { action, computed, makeObservable, observable, reaction, runInAction } from 'mobx'
import { FeaturesController } from '../FeaturesController'
import { debounce, destroyAllObjectProperties } from '@/Utils'
import { isValidFutureSiblings, rootTags, tagSiblings } from './Utils'
import { AnyTag } from './AnyTagType'
import { CrossControllerEvent } from '../CrossControllerEvent'
import { AbstractViewController } from '../Abstract/AbstractViewController'
import { Persistable } from '../Abstract/Persistable'
import { TagListSectionType } from '@/Components/Tags/TagListSection'
import { PaneLayout } from '../PaneController/PaneLayout'
import { TagsCountsState } from './TagsCountsState'
import { PaneController } from '../PaneController/PaneController'

export class NavigationController
  extends AbstractViewController
  implements Persistable<NavigationControllerPersistableValue>, InternalEventHandlerInterface
{
  tags: SNTag[] = []
  smartViews: SmartView[] = []
  starredTags: SNTag[] = []
  allNotesCount_ = 0
  allFilesCount_ = 0
  selectedUuid: AnyTag['uuid'] | undefined = undefined
  selected_: AnyTag | undefined = undefined
  selectedLocation: TagListSectionType | undefined = undefined
  previouslySelected_: AnyTag | undefined = undefined
  editing_: SNTag | SmartView | undefined = undefined
  addingSubtagTo: SNTag | undefined = undefined

  contextMenuOpen = false
  contextMenuClickLocation: { x: number; y: number } = { x: 0, y: 0 }
  contextMenuTag: SNTag | undefined = undefined
  contextMenuTagSection: TagListSectionType | undefined = undefined

  searchQuery = ''

  private readonly tagsCountsState: TagsCountsState

  constructor(
    private featuresController: FeaturesController,
    private vaultDisplayService: VaultDisplayService,
    private keyboardService: KeyboardService,
    private paneController: PaneController,
    private sync: SyncServiceInterface,
    private mutator: MutatorClientInterface,
    private items: ItemManagerInterface,
    private preferences: PreferenceServiceInterface,
    private alerts: AlertService,
    private _changeAndSaveItem: ChangeAndSaveItem,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    eventBus.addEventHandler(this, VaultDisplayServiceEvent.VaultDisplayOptionsChanged)

    this.tagsCountsState = new TagsCountsState(items)
    this.smartViews = items.getSmartViews()

    makeObservable(this, {
      tags: observable,
      starredTags: observable,
      smartViews: observable.ref,
      allNotesCount_: observable,
      allFilesCount_: observable,
      allNotesCount: computed,
      allFilesCount: computed,
      setAllNotesCount: action,
      setAllFilesCount: action,

      selected_: observable,
      selectedLocation: observable,
      previouslySelected_: observable.ref,
      previouslySelected: computed,
      editing_: observable.ref,
      selected: computed,
      selectedUuid: observable,
      editingTag: computed,

      addingSubtagTo: observable,
      setAddingSubtagTo: action,

      assignParent: action,

      rootTags: computed,
      tagsCount: computed,

      createNewTemplate: action,
      undoCreateNewTag: action,
      save: action,
      remove: action,

      contextMenuOpen: observable,
      contextMenuClickLocation: observable,
      setContextMenuOpen: action,
      setContextMenuClickLocation: action,
      contextMenuTag: observable,
      setContextMenuTag: action,

      isInFilesView: computed,

      hydrateFromPersistedValue: action,

      searchQuery: observable,
      setSearchQuery: action,
    })

    this.disposers.push(
      this.items.streamItems([ContentType.TYPES.Tag, ContentType.TYPES.SmartView], ({ changed, removed }) => {
        this.reloadTags()

        if (this.contextMenuTag && FindItem(removed, this.contextMenuTag.uuid)) {
          this.setContextMenuTag(undefined)
        }

        runInAction(() => {
          const currentSelectedTag = this.selected_

          if (!currentSelectedTag) {
            return
          }

          const updatedReference =
            FindItem(changed, currentSelectedTag.uuid) || FindItem(this.smartViews, currentSelectedTag.uuid)
          if (updatedReference) {
            this.setSelectedTagInstance(updatedReference as AnyTag)
          }

          if (isSystemView(currentSelectedTag as SmartView)) {
            return
          }

          if (FindItem(removed, currentSelectedTag.uuid)) {
            this.setSelectedTagInstance(this.smartViews[0])
          }
        })
      }),
    )

    this.disposers.push(
      this.items.addNoteCountChangeObserver((tagUuid) => {
        if (!tagUuid) {
          this.setAllNotesCount(this.items.allCountableNotesCount())
          this.setAllFilesCount(this.items.allCountableFilesCount())
        } else {
          const tag = this.items.findItem<SNTag>(tagUuid)
          if (tag) {
            this.tagsCountsState.update([tag])
          }
        }
      }),
    )

    this.disposers.push(
      reaction(
        () => this.selectedUuid,
        () => {
          eventBus.publish({
            type: CrossControllerEvent.RequestValuePersistence,
            payload: undefined,
          })
        },
      ),
    )

    this.disposers.push(
      this.keyboardService.addCommandHandler({
        command: CREATE_NEW_TAG_COMMAND,
        category: 'General',
        description: 'Create new tag',
        onKeyDown: () => {
          this.createNewTemplate()
        },
      }),
    )

    this.setDisplayOptionsAndReloadTags = debounce(this.setDisplayOptionsAndReloadTags, 50)
  }

  private reloadTags(): void {
    runInAction(() => {
      this.tags = this.items.getDisplayableTags()
      this.starredTags = this.tags.filter((tag) => tag.starred)
      this.smartViews = this.items.getSmartViews().filter((view) => {
        if (!this.isSearching) {
          return true
        }
        return !isSystemView(view)
      })
    })
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === VaultDisplayServiceEvent.VaultDisplayOptionsChanged) {
      this.reloadTags()
      if (this.selectedUuid) {
        this.findAndSetTag(this.selectedUuid)
      } else {
        this.selectHomeNavigationView().catch(console.error)
      }
    }
  }

  private findAndSetTag = (uuid: UuidString) => {
    const tagToSelect = [...this.tags, ...this.smartViews].find((tag) => tag.uuid === uuid)
    if (tagToSelect) {
      void this.setSelectedTag(tagToSelect, isTag(tagToSelect) ? (tagToSelect.starred ? 'favorites' : 'all') : 'views')
    }
  }

  private selectHydratedTagOrDefault = () => {
    if (this.selectedUuid && !this.selected_) {
      this.findAndSetTag(this.selectedUuid)
    }

    if (!this.selectedUuid) {
      void this.selectHomeNavigationView()
    }
  }

  getPersistableValue = (): NavigationControllerPersistableValue => {
    return {
      selectedTagUuid: this.selectedUuid ? this.selectedUuid : SystemViewId.AllNotes,
    }
  }

  hydrateFromPersistedValue = (state: NavigationControllerPersistableValue | undefined) => {
    const uuidsToPreventHydrationOf: string[] = [SystemViewId.Files]

    if (!state || uuidsToPreventHydrationOf.includes(state.selectedTagUuid)) {
      void this.selectHomeNavigationView()
      return
    }

    if (state.selectedTagUuid) {
      this.selectedUuid = state.selectedTagUuid
      this.selectHydratedTagOrDefault()
    }
  }

  override deinit() {
    super.deinit()
    ;(this.featuresController as unknown) = undefined
    ;(this.tags as unknown) = undefined
    ;(this.smartViews as unknown) = undefined
    ;(this.selected_ as unknown) = undefined
    ;(this.previouslySelected_ as unknown) = undefined
    ;(this.editing_ as unknown) = undefined
    ;(this.addingSubtagTo as unknown) = undefined
    ;(this.featuresController as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  async createSubtagAndAssignParent(parent: SNTag, title: string) {
    const hasEmptyTitle = title.length === 0

    if (hasEmptyTitle) {
      this.setAddingSubtagTo(undefined)
      return
    }

    const createdTag = await this.mutator.createTagOrSmartView<SNTag>(
      title,
      this.vaultDisplayService.exclusivelyShownVault,
    )

    const futureSiblings = this.items.getTagChildren(parent)

    if (!isValidFutureSiblings(this.alerts, futureSiblings, createdTag)) {
      this.setAddingSubtagTo(undefined)
      this.remove(createdTag, false).catch(console.error)
      return
    }

    this.assignParent(createdTag.uuid, parent.uuid).catch(console.error)

    this.sync.sync().catch(console.error)

    runInAction(() => {
      void this.setSelectedTag(createdTag as SNTag, 'all')
    })

    this.setAddingSubtagTo(undefined)
  }

  public isInSmartView(): boolean {
    return this.selected instanceof SmartView
  }

  public isInHomeView(): boolean {
    return this.selected instanceof SmartView && this.selected.uuid === SystemViewId.AllNotes
  }

  public get isInFilesView(): boolean {
    return this.selectedUuid === SystemViewId.Files
  }

  isTagFilesView(tag: AnyTag): boolean {
    return tag.uuid === SystemViewId.Files
  }

  tagUsesTableView(tag: AnyTag): boolean {
    const isSystemView = tag instanceof SmartView && Object.values(SystemViewId).includes(tag.uuid as SystemViewId)
    const useTableView = isSystemView
      ? this.preferences.getValue(PrefKey.SystemViewPreferences)?.[tag.uuid as SystemViewId]
      : tag?.preferences
    return Boolean(useTableView)
  }

  public isInAnySystemView(): boolean {
    return (
      this.selected instanceof SmartView && Object.values(SystemViewId).includes(this.selected.uuid as SystemViewId)
    )
  }

  public isInSystemView(id: SystemViewId): boolean {
    return this.selected instanceof SmartView && this.selected.uuid === id
  }

  public get selectedAsTag(): SNTag | undefined {
    if (!this.selected || !isTag(this.selected)) {
      return undefined
    }
    return this.selected
  }

  setAddingSubtagTo(tag: SNTag | undefined): void {
    this.addingSubtagTo = tag
  }

  setContextMenuOpen(open: boolean): void {
    this.contextMenuOpen = open
  }

  setContextMenuClickLocation(location: { x: number; y: number }): void {
    this.contextMenuClickLocation = location
  }

  setContextMenuTag(tag: SNTag | undefined, section: TagListSectionType = 'all'): void {
    this.contextMenuTag = tag
    this.contextMenuTagSection = section
  }

  public get allLocalRootTags(): SNTag[] {
    if (this.editing_ instanceof SNTag && this.items.isTemplateItem(this.editing_)) {
      return [this.editing_, ...this.rootTags]
    }
    return this.rootTags
  }

  public getNotesCount(tag: SNTag): number {
    return this.tagsCountsState.counts[tag.uuid] || 0
  }

  getChildren(tag: SNTag): SNTag[] {
    if (this.items.isTemplateItem(tag)) {
      return []
    }

    const children = this.items.getTagChildren(tag)

    const childrenUuids = children.map((childTag) => childTag.uuid)
    const childrenTags = this.isSearching ? children : this.tags.filter((tag) => childrenUuids.includes(tag.uuid))
    return childrenTags
  }

  isValidTagParent(parent: SNTag, tag: SNTag): boolean {
    return this.items.isValidTagParent(parent, tag)
  }

  public hasParent(tagUuid: UuidString): boolean {
    const item = this.items.findItem(tagUuid)
    return !!item && !!(item as SNTag).parentId
  }

  public async assignParent(tagUuid: string, futureParentUuid: string | undefined): Promise<void> {
    const tag = this.items.findItem(tagUuid) as SNTag

    const currentParent = this.items.getTagParent(tag)
    const currentParentUuid = currentParent?.uuid

    if (currentParentUuid === futureParentUuid) {
      return
    }

    const futureParent = futureParentUuid && (this.items.findItem(futureParentUuid) as SNTag)

    if (!futureParent) {
      const futureSiblings = rootTags(this.items)
      if (!isValidFutureSiblings(this.alerts, futureSiblings, tag)) {
        return
      }
      await this.mutator.unsetTagParent(tag)
    } else {
      const futureSiblings = this.items.getTagChildren(futureParent)
      if (!isValidFutureSiblings(this.alerts, futureSiblings, tag)) {
        return
      }
      await this.mutator.setTagParent(futureParent, tag)
    }

    await this.sync.sync()
  }

  get rootTags(): SNTag[] {
    return this.tags.filter((tag) => !this.items.getDisplayableTagParent(tag))
  }

  get tagsCount(): number {
    return this.tags.length
  }

  setAllNotesCount(allNotesCount: number) {
    this.allNotesCount_ = allNotesCount
  }

  setAllFilesCount(allFilesCount: number) {
    this.allFilesCount_ = allFilesCount
  }

  public get allFilesCount(): number {
    return this.allFilesCount_
  }

  public get allNotesCount(): number {
    return this.allNotesCount_
  }

  public get previouslySelected(): AnyTag | undefined {
    return this.previouslySelected_
  }

  public get selected(): AnyTag | undefined {
    return this.selected_
  }

  public async setPanelWidthForTag(tag: SNTag, width: number): Promise<void> {
    await this._changeAndSaveItem.execute<TagMutator>(tag, (mutator) => {
      mutator.preferences = {
        ...mutator.preferences,
        panelWidth: width,
      }
    })
  }

  public async setSelectedTag(
    tag: AnyTag | undefined,
    location: TagListSectionType,
    { userTriggered } = { userTriggered: false },
  ) {
    if (tag && tag.conflictOf) {
      this._changeAndSaveItem
        .execute(tag, (mutator) => {
          mutator.conflictOf = undefined
        })
        .catch(console.error)
    }

    if (tag && (this.isTagFilesView(tag) || this.tagUsesTableView(tag))) {
      this.paneController.setPaneLayout(PaneLayout.TableView)
    } else if (userTriggered) {
      this.paneController.setPaneLayout(PaneLayout.ItemSelection)
    }

    this.previouslySelected_ = this.selected_

    await runInAction(async () => {
      this.setSelectedTagInstance(tag)
      this.selectedLocation = location

      if (tag && this.items.isTemplateItem(tag)) {
        return
      }

      await this.eventBus.publishSync(
        {
          type: CrossControllerEvent.TagChanged,
          payload: { tag, previousTag: this.previouslySelected_, userTriggered: userTriggered },
        },
        InternalEventPublishStrategy.SEQUENCE,
      )
    })
  }

  public async selectHomeNavigationView(): Promise<void> {
    await this.setSelectedTag(this.homeNavigationView, 'views')
  }

  public async selectFilesView() {
    await this.setSelectedTag(this.filesNavigationView, 'views')
  }

  get homeNavigationView(): SmartView {
    return this.smartViews[0]
  }

  get filesNavigationView(): SmartView {
    return this.smartViews.find(this.isTagFilesView) as SmartView
  }

  private setSelectedTagInstance(tag: AnyTag | undefined): void {
    runInAction(() => {
      this.selected_ = tag
      this.selectedUuid = tag ? tag.uuid : undefined
    })
  }

  public setExpanded(tag: SNTag, expanded: boolean) {
    if (tag.expanded === expanded) {
      return
    }

    this._changeAndSaveItem
      .execute<TagMutator>(tag, (mutator) => {
        mutator.expanded = expanded
      })
      .catch(console.error)
  }

  public async setFavorite(tag: SNTag, favorite: boolean) {
    return this._changeAndSaveItem
      .execute<TagMutator>(tag, (mutator) => {
        mutator.starred = favorite
      })
      .catch(console.error)
  }

  public setIcon(tag: SNTag, icon: VectorIconNameOrEmoji) {
    this._changeAndSaveItem
      .execute<TagMutator>(tag, (mutator) => {
        mutator.iconString = icon as string
      })
      .catch(console.error)
  }

  public get editingTag(): SNTag | SmartView | undefined {
    return this.editing_
  }

  public setEditingTag(editingTag: SNTag | SmartView | undefined) {
    runInAction(() => {
      this.editing_ = editingTag
      if (this.selected !== editingTag) {
        void this.setSelectedTag(editingTag, this.selectedLocation || 'all')
      }
    })
  }

  public createNewTemplate() {
    const isAlreadyEditingATemplate = this.editing_ && this.items.isTemplateItem(this.editing_)

    if (isAlreadyEditingATemplate) {
      return
    }

    const newTag = this.items.createTemplateItem(ContentType.TYPES.Tag) as SNTag

    runInAction(() => {
      this.selectedLocation = 'all'
      this.editing_ = newTag
    })
  }

  public undoCreateNewTag() {
    this.editing_ = undefined
    const previousTag = this.previouslySelected_ || this.smartViews[0]
    void this.setSelectedTag(previousTag, this.selectedLocation || 'views')
  }

  public async remove(tag: SNTag | SmartView, userTriggered: boolean) {
    let shouldDelete = !userTriggered
    if (userTriggered) {
      shouldDelete = await confirmDialog({
        title: `Delete tag "${tag.title}"?`,
        text: STRING_DELETE_TAG,
        confirmButtonStyle: 'danger',
      })
    }
    if (shouldDelete) {
      this.mutator
        .deleteItem(tag)
        .then(() => this.sync.sync())
        .catch(console.error)
      await this.setSelectedTag(this.smartViews[0], 'views')
    }
  }

  public async save(tag: SNTag | SmartView, newTitle: string) {
    const isTemplateChange = this.items.isTemplateItem(tag)

    const latestVersion = isTemplateChange ? tag : this.items.findSureItem(tag.uuid)

    const hasEmptyTitle = newTitle.length === 0
    const hasNotChangedTitle = newTitle === latestVersion.title

    const siblings = latestVersion instanceof SNTag ? tagSiblings(this.items, latestVersion) : []
    const hasDuplicatedTitle = siblings.some((other) => other.title.toLowerCase() === newTitle.toLowerCase())

    runInAction(() => {
      this.editing_ = undefined
    })

    if (hasEmptyTitle || hasNotChangedTitle) {
      if (isTemplateChange) {
        this.undoCreateNewTag()
      }
      return
    }

    if (hasDuplicatedTitle) {
      if (isTemplateChange) {
        this.undoCreateNewTag()
      }
      this.alerts.alert('A tag with this name already exists.').catch(console.error)
      return
    }

    if (isTemplateChange) {
      const isSmartViewTitle = this.items.isSmartViewTitle(newTitle)

      if (isSmartViewTitle) {
        if (!this.featuresController.hasSmartViews) {
          await this.featuresController.showPremiumAlert(SMART_TAGS_FEATURE_NAME)
          return
        }
      }

      const insertedTag = await this.mutator.createTagOrSmartView<SNTag>(
        newTitle,
        this.vaultDisplayService.exclusivelyShownVault,
      )
      this.sync.sync().catch(console.error)
      runInAction(() => {
        void this.setSelectedTag(insertedTag, this.selectedLocation || 'views')
      })
    } else {
      await this._changeAndSaveItem.execute<TagMutator>(latestVersion, (mutator) => {
        mutator.title = newTitle
      })
    }
  }

  private setDisplayOptionsAndReloadTags = () => {
    this.items.setTagsAndViewsDisplayOptions({
      searchQuery: {
        query: this.searchQuery,
        includeProtectedNoteText: false,
      },
    })
    this.reloadTags()
  }

  public setSearchQuery = (query: string) => {
    this.searchQuery = query
    this.setDisplayOptionsAndReloadTags()
  }

  public get isSearching(): boolean {
    return this.searchQuery.length > 0
  }
}
