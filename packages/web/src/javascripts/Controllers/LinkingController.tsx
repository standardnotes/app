import { WebApplication } from '@/Application/Application'
import { PopoverFileItemActionType } from '@/Components/AttachedFilesPopover/PopoverFileItemAction'
import { AppPaneId } from '@/Components/ResponsivePane/AppPaneMetadata'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { doesItemMatchSearchQuery } from '@/Utils/Items/Search'
import {
  ApplicationEvent,
  ContentType,
  DecryptedItemInterface,
  FileItem,
  IconType,
  InternalEventBus,
  ItemContent,
  naturalSort,
  NoteViewController,
  PrefKey,
  SNNote,
  SNTag,
  isFile,
  isNote,
} from '@standardnotes/snjs'
import { action, computed, makeObservable, observable } from 'mobx'
import { AbstractViewController } from './Abstract/AbstractViewController'
import { FilesController } from './FilesController'
import { ItemListController } from './ItemList/ItemListController'
import { NavigationController } from './Navigation/NavigationController'
import { SelectedItemsController } from './SelectedItemsController'
import { SubscriptionController } from './Subscription/SubscriptionController'

export type LinkableItem = DecryptedItemInterface<ItemContent>

export type ItemLink<ItemType extends LinkableItem = LinkableItem> = {
  id: string
  item: ItemType
  type: 'linked' | 'linked-by'
}

export class LinkingController extends AbstractViewController {
  tags: ItemLink<SNTag>[] = []
  linkedFiles: ItemLink<FileItem>[] = []
  filesLinkingToActiveItem: ItemLink<FileItem>[] = []
  notesLinkedToItem: ItemLink<SNNote>[] = []
  notesLinkingToActiveItem: ItemLink<SNNote>[] = []
  shouldLinkToParentFolders: boolean
  isLinkingPanelOpen = false
  private itemListController!: ItemListController
  private filesController!: FilesController
  private subscriptionController!: SubscriptionController

  constructor(
    application: WebApplication,
    private navigationController: NavigationController,
    private selectionController: SelectedItemsController,
    eventBus: InternalEventBus,
  ) {
    super(application, eventBus)

    makeObservable(this, {
      tags: observable,
      linkedFiles: observable,
      filesLinkingToActiveItem: observable,
      notesLinkedToItem: observable,
      notesLinkingToActiveItem: observable,
      isLinkingPanelOpen: observable,

      allItemLinks: computed,
      isEntitledToNoteLinking: computed,
      selectedItemTitle: computed,

      setIsLinkingPanelOpen: action,
      reloadLinkedFiles: action,
      reloadLinkedTags: action,
      reloadLinkedNotes: action,
      reloadNotesLinkingToItem: action,
    })

    this.shouldLinkToParentFolders = application.getPreference(
      PrefKey.NoteAddToParentFolders,
      PrefDefaults[PrefKey.NoteAddToParentFolders],
    )

    this.disposers.push(
      this.application.addSingleEventObserver(ApplicationEvent.PreferencesChanged, async () => {
        this.shouldLinkToParentFolders = this.application.getPreference(
          PrefKey.NoteAddToParentFolders,
          PrefDefaults[PrefKey.NoteAddToParentFolders],
        )
      }),
    )
  }

  public setServicesPostConstruction(
    itemListController: ItemListController,
    filesController: FilesController,
    subscriptionController: SubscriptionController,
  ) {
    this.itemListController = itemListController
    this.filesController = filesController
    this.subscriptionController = subscriptionController

    this.disposers.push(
      this.application.streamItems(ContentType.File, () => {
        this.reloadLinkedFiles()
      }),
      this.application.streamItems(ContentType.Tag, () => {
        this.reloadLinkedTags()
      }),
      this.application.streamItems(ContentType.Note, () => {
        this.reloadLinkedNotes()
        this.reloadNotesLinkingToItem()
      }),
    )
  }

  get isEntitledToNoteLinking() {
    return !!this.subscriptionController.userSubscription
  }

  setIsLinkingPanelOpen = (open: boolean) => {
    this.isLinkingPanelOpen = open
  }

  get allItemLinks() {
    return [...this.tags, ...this.linkedFiles, ...this.notesLinkedToItem]
  }

  get activeItem() {
    return this.itemListController.activeControllerItem
  }

  get selectedItemTitle() {
    return this.selectionController.firstSelectedItem
      ? this.selectionController.firstSelectedItem.title
      : this.activeItem
      ? this.activeItem.title
      : ''
  }

  reloadAllLinks() {
    this.reloadLinkedFiles()
    this.reloadLinkedTags()
    this.reloadLinkedNotes()
    this.reloadNotesLinkingToItem()
  }

  createLinkFromItem = <I extends LinkableItem = LinkableItem>(itemA: I, type: 'linked' | 'linked-by'): ItemLink<I> => {
    return {
      id: `${itemA.uuid}-${type}`,
      item: itemA,
      type,
    }
  }

  reloadLinkedFiles() {
    if (!this.activeItem || this.application.items.isTemplateItem(this.activeItem)) {
      this.linkedFiles = []
      this.filesLinkingToActiveItem = []
      return
    }

    const referencesOfActiveItem = naturalSort(
      this.application.items.referencesForItem(this.activeItem).filter(isFile),
      'title',
    )

    const referencingActiveItem = naturalSort(
      this.application.items.itemsReferencingItem(this.activeItem).filter(isFile),
      'title',
    )

    if (this.activeItem.content_type === ContentType.File) {
      this.linkedFiles = referencesOfActiveItem.map((item) => this.createLinkFromItem(item, 'linked'))
      this.filesLinkingToActiveItem = referencingActiveItem.map((item) => this.createLinkFromItem(item, 'linked-by'))
    } else {
      this.linkedFiles = referencingActiveItem.map((item) => this.createLinkFromItem(item, 'linked'))
      this.filesLinkingToActiveItem = referencesOfActiveItem.map((item) => this.createLinkFromItem(item, 'linked-by'))
    }
  }

  reloadLinkedTags() {
    if (!this.activeItem) {
      return
    }

    this.tags = this.application.items
      .getSortedTagsForItem(this.activeItem)
      .map((item) => this.createLinkFromItem(item, 'linked'))
  }

  reloadLinkedNotes() {
    if (!this.activeItem || this.application.items.isTemplateItem(this.activeItem)) {
      this.notesLinkedToItem = []
      return
    }

    this.notesLinkedToItem = naturalSort(
      this.application.items.referencesForItem(this.activeItem).filter(isNote),
      'title',
    ).map((item) => this.createLinkFromItem(item, 'linked'))
  }

  reloadNotesLinkingToItem() {
    if (!this.activeItem) {
      this.notesLinkingToActiveItem = []
      return
    }

    this.notesLinkingToActiveItem = naturalSort(
      this.application.items.itemsReferencingItem(this.activeItem).filter(isNote),
      'title',
    ).map((item) => this.createLinkFromItem(item, 'linked-by'))
  }

  getTitleForLinkedTag = (item: LinkableItem) => {
    const isTag = item instanceof SNTag

    if (!isTag) {
      return
    }

    const titlePrefix = this.application.items.getTagPrefixTitle(item)
    const longTitle = this.application.items.getTagLongTitle(item)
    return {
      titlePrefix,
      longTitle,
    }
  }

  getLinkedItemIcon = (item: LinkableItem): [IconType, string] => {
    if (item instanceof SNNote) {
      const editorForNote = this.application.componentManager.editorForNote(item)
      const [icon, tint] = this.application.iconsController.getIconAndTintForNoteType(
        editorForNote?.package_info.note_type,
      )
      const className = `text-accessory-tint-${tint}`
      return [icon, className]
    } else if (item instanceof FileItem) {
      const icon = this.application.iconsController.getIconForFileType(item.mimeType)
      return [icon, 'text-info']
    } else if (item instanceof SNTag) {
      return [item.iconString as IconType, 'text-info']
    }

    throw new Error('Unhandled case in getLinkedItemIcon')
  }

  activateItem = async (item: LinkableItem): Promise<AppPaneId | undefined> => {
    this.setIsLinkingPanelOpen(false)

    if (item instanceof SNTag) {
      await this.navigationController.setSelectedTag(item, 'all')
      return AppPaneId.Items
    } else if (item instanceof SNNote) {
      await this.navigationController.selectHomeNavigationView()
      const { didSelect } = await this.selectionController.selectItem(item.uuid, true)
      if (didSelect) {
        return AppPaneId.Editor
      }
    } else if (item instanceof FileItem) {
      await this.filesController.handleFileAction({
        type: PopoverFileItemActionType.PreviewFile,
        payload: {
          file: item,
          otherFiles: [],
        },
      })
    }

    return undefined
  }

  unlinkItemFromSelectedItem = async (itemToUnlink: ItemLink) => {
    const selectedItem = this.selectionController.firstSelectedItem

    if (!selectedItem) {
      return
    }

    await this.application.items.unlinkItems(selectedItem, itemToUnlink.item)

    void this.application.sync.sync()
    this.reloadAllLinks()
  }

  ensureActiveItemIsInserted = async () => {
    const activeItemController = this.itemListController.getActiveItemController()
    if (activeItemController instanceof NoteViewController && activeItemController.isTemplateNote) {
      await activeItemController.insertTemplatedNote()
    }
  }

  linkItems = async (item: LinkableItem, itemToLink: LinkableItem) => {
    if (item instanceof SNNote) {
      if (itemToLink instanceof FileItem) {
        await this.application.items.associateFileWithNote(itemToLink, item)
      } else if (itemToLink instanceof SNNote && this.isEntitledToNoteLinking) {
        await this.application.items.linkNoteToNote(item, itemToLink)
      } else if (itemToLink instanceof SNTag) {
        await this.addTagToItem(itemToLink, item)
      }
    } else if (item instanceof FileItem) {
      if (itemToLink instanceof SNNote) {
        await this.application.items.associateFileWithNote(item, itemToLink)
      } else if (itemToLink instanceof FileItem) {
        await this.application.items.linkFileToFile(item, itemToLink)
      } else if (itemToLink instanceof SNTag) {
        await this.addTagToItem(itemToLink, item)
      }
    }

    void this.application.sync.sync()
    this.reloadAllLinks()
  }

  linkItemToSelectedItem = async (itemToLink: LinkableItem) => {
    await this.ensureActiveItemIsInserted()
    const activeItem = this.activeItem

    if (!activeItem) {
      return
    }

    await this.linkItems(activeItem, itemToLink)
  }

  createAndAddNewTag = async (title: string) => {
    await this.ensureActiveItemIsInserted()
    const activeItem = this.activeItem
    const newTag = await this.application.mutator.findOrCreateTag(title)
    if (activeItem) {
      await this.addTagToItem(newTag, activeItem)
    }
  }

  addTagToItem = async (tag: SNTag, item: FileItem | SNNote) => {
    if (item instanceof SNNote) {
      await this.application.items.addTagToNote(item, tag, this.shouldLinkToParentFolders)
    } else if (item instanceof FileItem) {
      await this.application.items.addTagToFile(item, tag, this.shouldLinkToParentFolders)
    }

    this.reloadLinkedTags()
    this.application.sync.sync().catch(console.error)
  }

  doesItemMatchSearchQuery = (item: LinkableItem, searchQuery: string) => {
    return doesItemMatchSearchQuery(item, searchQuery, this.application)
  }

  isSearchResultAlreadyLinked = (item: LinkableItem) => {
    if (!this.activeItem) {
      return false
    }

    let isAlreadyLinked = false

    const isItemReferencedByActiveItem = this.activeItem.references.some((ref) => ref.uuid === item.uuid)
    const isActiveItemReferencedByItem = item.references.some((ref) => ref.uuid === this.activeItem?.uuid)

    if (this.activeItem.content_type === item.content_type) {
      isAlreadyLinked = isItemReferencedByActiveItem
    } else {
      isAlreadyLinked = isActiveItemReferencedByItem || isItemReferencedByActiveItem
    }

    return isAlreadyLinked
  }

  isSearchResultExistingTag = (result: DecryptedItemInterface<ItemContent>, searchQuery: string) =>
    result.content_type === ContentType.Tag && result.title === searchQuery

  getSearchResults = (searchQuery: string) => {
    let unlinkedResults: LinkableItem[] = []
    const linkedResults: ItemLink<LinkableItem>[] = []
    let shouldShowCreateTag = false

    const defaultReturnValue = {
      linkedResults,
      unlinkedResults,
      shouldShowCreateTag,
    }

    if (!searchQuery.length) {
      return defaultReturnValue
    }

    if (!this.activeItem) {
      return defaultReturnValue
    }

    const searchableItems = naturalSort(
      this.application.items.getItems([ContentType.Note, ContentType.File, ContentType.Tag]),
      'title',
    )

    const unlinkedTags: LinkableItem[] = []
    const unlinkedNotes: LinkableItem[] = []
    const unlinkedFiles: LinkableItem[] = []

    for (let index = 0; index < searchableItems.length; index++) {
      const item = searchableItems[index]

      if (this.activeItem?.uuid === item.uuid) {
        continue
      }

      if (!this.doesItemMatchSearchQuery(item, searchQuery)) {
        continue
      }

      if (this.isSearchResultAlreadyLinked(item)) {
        if (linkedResults.length < 20) {
          linkedResults.push(this.createLinkFromItem(item, 'linked'))
        }
        continue
      }

      if (unlinkedTags.length < 5 && item.content_type === ContentType.Tag) {
        unlinkedTags.push(item)
        continue
      }

      if (unlinkedNotes.length < 5 && item.content_type === ContentType.Note) {
        unlinkedNotes.push(item)
        continue
      }

      if (unlinkedFiles.length < 5 && item.content_type === ContentType.File) {
        unlinkedFiles.push(item)
        continue
      }
    }

    unlinkedResults = unlinkedTags.concat(unlinkedNotes).concat(unlinkedFiles)

    shouldShowCreateTag =
      !linkedResults.find((link) => this.isSearchResultExistingTag(link.item, searchQuery)) &&
      !unlinkedResults.find((item) => this.isSearchResultExistingTag(item, searchQuery))

    return {
      unlinkedResults,
      linkedResults,
      shouldShowCreateTag,
    }
  }
}
