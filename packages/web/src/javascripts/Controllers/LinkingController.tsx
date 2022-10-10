import { WebApplication } from '@/Application/Application'
import { PopoverFileItemActionType } from '@/Components/AttachedFilesPopover/PopoverFileItemAction'
import { AppPaneId } from '@/Components/ResponsivePane/AppPaneMetadata'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import {
  ApplicationEvent,
  ContentType,
  DecryptedItemInterface,
  FileItem,
  IconType,
  InternalEventBus,
  ItemContent,
  naturalSort,
  PrefKey,
  SNNote,
  SNTag,
} from '@standardnotes/snjs'
import { action, computed, makeObservable, observable } from 'mobx'
import { AbstractViewController } from './Abstract/AbstractViewController'
import { FilesController } from './FilesController'
import { ItemListController } from './ItemList/ItemListController'
import { NavigationController } from './Navigation/NavigationController'
import { SelectedItemsController } from './SelectedItemsController'
import { SubscriptionController } from './Subscription/SubscriptionController'

export type LinkableItem = DecryptedItemInterface<ItemContent>

export class LinkingController extends AbstractViewController {
  tags: SNTag[] = []
  files: FileItem[] = []
  notesLinkedToItem: SNNote[] = []
  notesLinkingToItem: SNNote[] = []
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
      files: observable,
      notesLinkedToItem: observable,
      notesLinkingToItem: observable,
      isLinkingPanelOpen: observable,

      allLinkedItems: computed,
      isEntitledToNoteLinking: computed,

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

  get allLinkedItems() {
    return [...this.tags, ...this.files, ...this.notesLinkedToItem]
  }

  get activeItem() {
    return this.itemListController.activeControllerItem
  }

  reloadAllLinks() {
    this.reloadLinkedFiles()
    this.reloadLinkedTags()
    this.reloadLinkedNotes()
    this.reloadNotesLinkingToItem()
  }

  reloadLinkedFiles() {
    if (this.activeItem) {
      const files = this.application.items.getSortedFilesForItem(this.activeItem)
      this.files = files
    }
  }

  reloadLinkedTags() {
    if (this.activeItem) {
      const tags = this.application.items.getSortedTagsForItem(this.activeItem)
      this.tags = tags
    }
  }

  reloadLinkedNotes() {
    if (this.activeItem) {
      const notes = this.application.items.getSortedLinkedNotesForItem(this.activeItem)
      this.notesLinkedToItem = notes
    }
  }

  reloadNotesLinkingToItem() {
    if (this.activeItem) {
      const notes = this.application.items.getSortedNotesLinkingToItem(this.activeItem)
      this.notesLinkingToItem = notes
    }
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
    }

    return ['hashtag', 'text-info']
  }

  activateItem = async (item: LinkableItem): Promise<AppPaneId | undefined> => {
    this.setIsLinkingPanelOpen(false)

    if (item instanceof SNTag) {
      await this.navigationController.setSelectedTag(item)
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

  unlinkItemFromSelectedItem = async (itemToUnlink: LinkableItem) => {
    const selectedItem = this.selectionController.firstSelectedItem

    if (!selectedItem) {
      return
    }

    await this.application.items.unlinkItem(itemToUnlink, selectedItem)
    this.reloadAllLinks()
  }

  linkItemToSelectedItem = async (itemToLink: LinkableItem) => {
    const selectedItem = this.selectionController.firstSelectedItem

    if (itemToLink instanceof SNTag) {
      await this.addTagToActiveItem(itemToLink)
    }

    if (selectedItem instanceof SNNote) {
      if (itemToLink instanceof FileItem) {
        await this.application.items.associateFileWithNote(itemToLink, selectedItem)
      } else if (itemToLink instanceof SNNote && this.isEntitledToNoteLinking) {
        await this.application.items.linkNoteToNote(selectedItem, itemToLink)
      }
    } else if (selectedItem instanceof FileItem) {
      if (itemToLink instanceof SNNote) {
        await this.application.items.associateFileWithNote(selectedItem, itemToLink)
      } else if (itemToLink instanceof FileItem) {
        await this.application.items.linkFileToFile(itemToLink, selectedItem)
      }
    }

    void this.application.sync.sync()
    this.reloadAllLinks()
  }

  createAndAddNewTag = async (title: string) => {
    const newTag = await this.application.mutator.findOrCreateTag(title)
    await this.addTagToActiveItem(newTag)
  }

  addTagToActiveItem = async (tag: SNTag) => {
    const activeItem = this.itemListController.activeControllerItem

    if (!activeItem) {
      return
    }

    if (activeItem instanceof SNNote) {
      await this.application.items.addTagToNote(activeItem, tag, this.shouldLinkToParentFolders)
    } else if (activeItem instanceof FileItem) {
      await this.application.items.addTagToFile(activeItem, tag, this.shouldLinkToParentFolders)
    }

    this.reloadLinkedTags()
    this.application.sync.sync().catch(console.error)
  }

  getSearchResults = (searchQuery: string) => {
    if (!searchQuery.length) {
      return {
        linkedResults: [],
        unlinkedResults: [],
        shouldShowCreateTag: false,
      }
    }

    const searchResults = naturalSort(
      this.application.items.getItems([ContentType.Note, ContentType.File, ContentType.Tag]).filter((item) => {
        const title = item instanceof SNTag ? this.application.items.getTagLongTitle(item) : item.title
        const matchesQuery = title?.toLowerCase().includes(searchQuery.toLowerCase())
        const isNotActiveItem = this.activeItem?.uuid !== item.uuid
        const isArchivedOrTrashed = item.archived || item.trashed
        return matchesQuery && isNotActiveItem && !isArchivedOrTrashed
      }),
      'title',
    )

    const isAlreadyLinked = (item: LinkableItem) => {
      if (!this.activeItem) {
        return false
      }
      const isItemReferencedByActiveItem = this.application.items
        .itemsReferencingItem(item)
        .some((linkedItem) => linkedItem.uuid === this.activeItem?.uuid)
      const isActiveItemReferencedByItem = this.application.items
        .itemsReferencingItem(this.activeItem)
        .some((linkedItem) => linkedItem.uuid === item.uuid)
      const isAlreadyLinkedToItem =
        isItemReferencedByActiveItem || (item.content_type !== ContentType.Note && isActiveItemReferencedByItem)
      return isAlreadyLinkedToItem
    }

    const prioritizeTagResult = (
      itemA: DecryptedItemInterface<ItemContent>,
      itemB: DecryptedItemInterface<ItemContent>,
    ) => {
      if (itemA.content_type === ContentType.Tag && itemB.content_type !== ContentType.Tag) {
        return -1
      }
      if (itemB.content_type === ContentType.Tag && itemA.content_type !== ContentType.Tag) {
        return 1
      }
      return 0
    }

    const unlinkedResults = searchResults
      .slice(0, 20)
      .filter((item) => !isAlreadyLinked(item))
      .sort(prioritizeTagResult)
    const linkedResults = searchResults.filter(isAlreadyLinked).slice(0, 20)
    const isResultExistingTag = (result: LinkableItem) =>
      result.content_type === ContentType.Tag && result.title === searchQuery
    const shouldShowCreateTag = !linkedResults.find(isResultExistingTag) && !unlinkedResults.find(isResultExistingTag)

    return {
      unlinkedResults,
      linkedResults,
      shouldShowCreateTag,
    }
  }
}
