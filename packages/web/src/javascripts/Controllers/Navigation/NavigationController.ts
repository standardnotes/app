import { confirmDialog } from '@standardnotes/ui-services'
import { STRING_DELETE_TAG } from '@/Constants/Strings'
import { MAX_MENU_SIZE_MULTIPLIER, MENU_MARGIN_FROM_APP_BORDER, SMART_TAGS_FEATURE_NAME } from '@/Constants/Constants'
import {
  ComponentAction,
  ContentType,
  MessageData,
  SmartView,
  SNTag,
  TagMutator,
  UuidString,
  isSystemView,
  FindItem,
  SystemViewId,
  InternalEventBus,
  InternalEventPublishStrategy,
} from '@standardnotes/snjs'
import { action, computed, makeAutoObservable, makeObservable, observable, runInAction } from 'mobx'
import { WebApplication } from '../../Application/Application'
import { FeaturesController } from '../FeaturesController'
import { AbstractViewController } from '../Abstract/AbstractViewController'
import { destroyAllObjectProperties } from '@/Utils'
import { isValidFutureSiblings, rootTags, tagSiblings } from './Utils'
import { AnyTag } from './AnyTagType'
import { CrossControllerEvent } from '../CrossControllerEvent'

export class NavigationController extends AbstractViewController {
  tags: SNTag[] = []
  smartViews: SmartView[] = []
  starredTags: SNTag[] = []
  allNotesCount_ = 0
  selected_: AnyTag | undefined
  previouslySelected_: AnyTag | undefined
  editing_: SNTag | SmartView | undefined
  addingSubtagTo: SNTag | undefined

  contextMenuOpen = false
  contextMenuPosition: { top?: number; left: number; bottom?: number } = {
    top: 0,
    left: 0,
  }
  contextMenuClickLocation: { x: number; y: number } = { x: 0, y: 0 }
  contextMenuMaxHeight: number | 'auto' = 'auto'

  private readonly tagsCountsState: TagsCountsState

  constructor(application: WebApplication, private featuresController: FeaturesController, eventBus: InternalEventBus) {
    super(application, eventBus)

    this.tagsCountsState = new TagsCountsState(this.application)

    this.selected_ = undefined
    this.previouslySelected_ = undefined
    this.editing_ = undefined
    this.addingSubtagTo = undefined

    this.smartViews = this.application.items.getSmartViews()

    makeObservable(this, {
      tags: observable,
      starredTags: observable,
      smartViews: observable.ref,
      hasAtLeastOneFolder: computed,
      allNotesCount_: observable,
      allNotesCount: computed,
      setAllNotesCount: action,

      selected_: observable.ref,
      previouslySelected_: observable.ref,
      previouslySelected: computed,
      editing_: observable.ref,
      selected: computed,
      selectedUuid: computed,
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
      contextMenuPosition: observable,
      contextMenuMaxHeight: observable,
      contextMenuClickLocation: observable,
      setContextMenuOpen: action,
      setContextMenuClickLocation: action,
      setContextMenuPosition: action,
      setContextMenuMaxHeight: action,

      isInFilesView: computed,
    })

    this.disposers.push(
      this.application.streamItems([ContentType.Tag, ContentType.SmartView], ({ changed, removed }) => {
        runInAction(() => {
          this.tags = this.application.items.getDisplayableTags()
          this.starredTags = this.tags.filter((tag) => tag.starred)
          this.smartViews = this.application.items.getSmartViews()

          const currrentSelectedTag = this.selected_

          if (!currrentSelectedTag) {
            this.setSelectedTagInstance(this.smartViews[0])

            return
          }

          const updatedReference =
            FindItem(changed, currrentSelectedTag.uuid) || FindItem(this.smartViews, currrentSelectedTag.uuid)
          if (updatedReference) {
            this.setSelectedTagInstance(updatedReference as AnyTag)
          }

          if (isSystemView(currrentSelectedTag as SmartView)) {
            return
          }

          if (FindItem(removed, currrentSelectedTag.uuid)) {
            this.setSelectedTagInstance(this.smartViews[0])
          }
        })
      }),
    )

    this.disposers.push(
      this.application.items.addNoteCountChangeObserver((tagUuid) => {
        if (!tagUuid) {
          this.setAllNotesCount(this.application.items.allCountableNotesCount())
        } else {
          const tag = this.application.items.findItem<SNTag>(tagUuid)
          if (tag) {
            this.tagsCountsState.update([tag])
          }
        }
      }),
    )
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

    const createdTag = (await this.application.mutator.createTagOrSmartView(title)) as SNTag

    const futureSiblings = this.application.items.getTagChildren(parent)

    if (!isValidFutureSiblings(this.application, futureSiblings, createdTag)) {
      this.setAddingSubtagTo(undefined)
      this.remove(createdTag, false).catch(console.error)
      return
    }

    this.assignParent(createdTag.uuid, parent.uuid).catch(console.error)

    this.application.sync.sync().catch(console.error)

    runInAction(() => {
      void this.setSelectedTag(createdTag as SNTag)
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

  public isInAnySystemView(): boolean {
    return (
      this.selected instanceof SmartView && Object.values(SystemViewId).includes(this.selected.uuid as SystemViewId)
    )
  }

  public isInSystemView(id: SystemViewId): boolean {
    return this.selected instanceof SmartView && this.selected.uuid === id
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

  setContextMenuPosition(position: { top?: number; left: number; bottom?: number }): void {
    this.contextMenuPosition = position
  }

  setContextMenuMaxHeight(maxHeight: number | 'auto'): void {
    this.contextMenuMaxHeight = maxHeight
  }

  reloadContextMenuLayout(): void {
    const { clientHeight } = document.documentElement
    const defaultFontSize = window.getComputedStyle(document.documentElement).fontSize
    const maxContextMenuHeight = parseFloat(defaultFontSize) * MAX_MENU_SIZE_MULTIPLIER
    const footerElementRect = document.getElementById('footer-bar')?.getBoundingClientRect()
    const footerHeightInPx = footerElementRect?.height

    let openUpBottom = true

    if (footerHeightInPx) {
      const bottomSpace = clientHeight - footerHeightInPx - this.contextMenuClickLocation.y
      const upSpace = this.contextMenuClickLocation.y

      const notEnoughSpaceToOpenUpBottom = maxContextMenuHeight > bottomSpace
      if (notEnoughSpaceToOpenUpBottom) {
        const enoughSpaceToOpenBottomUp = upSpace > maxContextMenuHeight
        if (enoughSpaceToOpenBottomUp) {
          openUpBottom = false
          this.setContextMenuMaxHeight('auto')
        } else {
          const hasMoreUpSpace = upSpace > bottomSpace
          if (hasMoreUpSpace) {
            this.setContextMenuMaxHeight(upSpace - MENU_MARGIN_FROM_APP_BORDER)
            openUpBottom = false
          } else {
            this.setContextMenuMaxHeight(bottomSpace - MENU_MARGIN_FROM_APP_BORDER)
          }
        }
      } else {
        this.setContextMenuMaxHeight('auto')
      }
    }

    if (openUpBottom) {
      this.setContextMenuPosition({
        top: this.contextMenuClickLocation.y,
        left: this.contextMenuClickLocation.x,
      })
    } else {
      this.setContextMenuPosition({
        bottom: clientHeight - this.contextMenuClickLocation.y,
        left: this.contextMenuClickLocation.x,
      })
    }
  }

  public get allLocalRootTags(): SNTag[] {
    if (this.editing_ instanceof SNTag && this.application.items.isTemplateItem(this.editing_)) {
      return [this.editing_, ...this.rootTags]
    }
    return this.rootTags
  }

  public getNotesCount(tag: SNTag): number {
    return this.tagsCountsState.counts[tag.uuid] || 0
  }

  getChildren(tag: SNTag): SNTag[] {
    if (this.application.items.isTemplateItem(tag)) {
      return []
    }

    const children = this.application.items.getTagChildren(tag)

    const childrenUuids = children.map((childTag) => childTag.uuid)
    const childrenTags = this.tags.filter((tag) => childrenUuids.includes(tag.uuid))
    return childrenTags
  }

  isValidTagParent(parent: SNTag, tag: SNTag): boolean {
    return this.application.items.isValidTagParent(parent, tag)
  }

  public hasParent(tagUuid: UuidString): boolean {
    const item = this.application.items.findItem(tagUuid)
    return !!item && !!(item as SNTag).parentId
  }

  public async assignParent(tagUuid: string, futureParentUuid: string | undefined): Promise<void> {
    const tag = this.application.items.findItem(tagUuid) as SNTag

    const currentParent = this.application.items.getTagParent(tag)
    const currentParentUuid = currentParent?.uuid

    if (currentParentUuid === futureParentUuid) {
      return
    }

    const futureParent = futureParentUuid && (this.application.items.findItem(futureParentUuid) as SNTag)

    if (!futureParent) {
      const futureSiblings = rootTags(this.application)
      if (!isValidFutureSiblings(this.application, futureSiblings, tag)) {
        return
      }
      await this.application.mutator.unsetTagParent(tag)
    } else {
      const futureSiblings = this.application.items.getTagChildren(futureParent)
      if (!isValidFutureSiblings(this.application, futureSiblings, tag)) {
        return
      }
      await this.application.mutator.setTagParent(futureParent, tag)
    }

    await this.application.sync.sync()
  }

  get rootTags(): SNTag[] {
    return this.tags.filter((tag) => !this.application.items.getTagParent(tag))
  }

  get tagsCount(): number {
    return this.tags.length
  }

  setAllNotesCount(allNotesCount: number) {
    this.allNotesCount_ = allNotesCount
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

  public async setSelectedTag(tag: AnyTag | undefined) {
    if (tag && tag.conflictOf) {
      this.application.mutator
        .changeAndSaveItem(tag, (mutator) => {
          mutator.conflictOf = undefined
        })
        .catch(console.error)
    }

    const selectionHasNotChanged = this.selected_?.uuid === tag?.uuid

    if (selectionHasNotChanged) {
      return
    }

    this.previouslySelected_ = this.selected_

    this.setSelectedTagInstance(tag)

    if (tag && this.application.items.isTemplateItem(tag)) {
      return
    }

    await this.eventBus.publishSync(
      {
        type: CrossControllerEvent.TagChanged,
        payload: { tag, previousTag: this.previouslySelected_ },
      },
      InternalEventPublishStrategy.SEQUENCE,
    )
  }

  public async selectHomeNavigationView(): Promise<void> {
    await this.setSelectedTag(this.homeNavigationView)
  }

  public async selectFilesView() {
    await this.setSelectedTag(this.filesNavigationView)
  }

  get homeNavigationView(): SmartView {
    return this.smartViews[0]
  }

  get filesNavigationView(): SmartView {
    return this.smartViews.find((view) => view.uuid === SystemViewId.Files) as SmartView
  }

  private setSelectedTagInstance(tag: AnyTag | undefined): void {
    runInAction(() => (this.selected_ = tag))
  }

  public setExpanded(tag: SNTag, expanded: boolean) {
    this.application.mutator
      .changeAndSaveItem<TagMutator>(tag, (mutator) => {
        mutator.expanded = expanded
      })
      .catch(console.error)
  }

  public async setFavorite(tag: SNTag, favorite: boolean) {
    return this.application.mutator
      .changeAndSaveItem<TagMutator>(tag, (mutator) => {
        mutator.starred = favorite
      })
      .catch(console.error)
  }

  public get selectedUuid(): UuidString | undefined {
    return this.selected_?.uuid
  }

  public get editingTag(): SNTag | SmartView | undefined {
    return this.editing_
  }

  public set editingTag(editingTag: SNTag | SmartView | undefined) {
    this.editing_ = editingTag
    void this.setSelectedTag(editingTag)
  }

  public createNewTemplate() {
    const isAlreadyEditingATemplate = this.editing_ && this.application.items.isTemplateItem(this.editing_)

    if (isAlreadyEditingATemplate) {
      return
    }

    const newTag = this.application.mutator.createTemplateItem(ContentType.Tag) as SNTag

    runInAction(() => {
      this.editing_ = newTag
    })
  }

  public undoCreateNewTag() {
    this.editing_ = undefined
    const previousTag = this.previouslySelected_ || this.smartViews[0]
    void this.setSelectedTag(previousTag)
  }

  public async remove(tag: SNTag | SmartView, userTriggered: boolean) {
    let shouldDelete = !userTriggered
    if (userTriggered) {
      shouldDelete = await confirmDialog({
        text: STRING_DELETE_TAG,
        confirmButtonStyle: 'danger',
      })
    }
    if (shouldDelete) {
      this.application.mutator.deleteItem(tag).catch(console.error)
      await this.setSelectedTag(this.smartViews[0])
    }
  }

  public async save(tag: SNTag | SmartView, newTitle: string) {
    const hasEmptyTitle = newTitle.length === 0
    const hasNotChangedTitle = newTitle === tag.title
    const isTemplateChange = this.application.items.isTemplateItem(tag)

    const siblings = tag instanceof SNTag ? tagSiblings(this.application, tag) : []
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
      this.application.alertService?.alert('A tag with this name already exists.').catch(console.error)
      return
    }

    if (isTemplateChange) {
      const isSmartViewTitle = this.application.items.isSmartViewTitle(newTitle)

      if (isSmartViewTitle) {
        if (!this.featuresController.hasSmartViews) {
          await this.featuresController.showPremiumAlert(SMART_TAGS_FEATURE_NAME)
          return
        }
      }

      const insertedTag = await this.application.mutator.createTagOrSmartView(newTitle)
      this.application.sync.sync().catch(console.error)
      runInAction(() => {
        void this.setSelectedTag(insertedTag as SNTag)
      })
    } else {
      await this.application.mutator.changeAndSaveItem<TagMutator>(tag, (mutator) => {
        mutator.title = newTitle
      })
    }
  }

  public onFoldersComponentMessage(action: ComponentAction, data: MessageData): void {
    if (action === ComponentAction.SelectItem) {
      const item = data.item

      if (!item) {
        return
      }

      if (item.content_type === ContentType.Tag || item.content_type === ContentType.SmartView) {
        const matchingTag = this.application.items.findItem(item.uuid)

        if (matchingTag) {
          void this.setSelectedTag(matchingTag as AnyTag)
          return
        }
      }
    } else if (action === ComponentAction.ClearSelection) {
      void this.setSelectedTag(this.smartViews[0])
    }
  }

  public get hasAtLeastOneFolder(): boolean {
    return this.tags.some((tag) => !!this.application.items.getTagParent(tag))
  }
}

class TagsCountsState {
  public counts: { [uuid: string]: number } = {}

  public constructor(private application: WebApplication) {
    makeAutoObservable(this, {
      counts: observable.ref,
      update: action,
    })
  }

  public update(tags: SNTag[]) {
    const newCounts: { [uuid: string]: number } = Object.assign({}, this.counts)

    tags.forEach((tag) => {
      newCounts[tag.uuid] = this.application.items.countableNotesForTag(tag)
    })

    this.counts = newCounts
  }
}
