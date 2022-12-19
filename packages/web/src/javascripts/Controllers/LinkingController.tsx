import { WebApplication } from '@/Application/Application'
import { FileItemActionType } from '@/Components/AttachedFilesPopover/PopoverFileItemAction'
import { NoteViewController } from '@/Components/NoteView/Controller/NoteViewController'
import { AppPaneId } from '@/Components/Panes/AppPaneMetadata'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { createLinkFromItem } from '@/Utils/Items/Search/createLinkFromItem'
import { LinkableItem } from '@/Utils/Items/Search/LinkableItem'
import {
  ApplicationEvent,
  ContentType,
  FileItem,
  InternalEventBus,
  naturalSort,
  PrefKey,
  SNNote,
  SNTag,
  isFile,
  isNote,
} from '@standardnotes/snjs'
import { action, computed, makeObservable, observable } from 'mobx'
import { AbstractViewController } from './Abstract/AbstractViewController'
import { CrossControllerEvent } from './CrossControllerEvent'
import { FilesController } from './FilesController'
import { ItemListController } from './ItemList/ItemListController'
import { NavigationController } from './Navigation/NavigationController'
import { SelectedItemsController } from './SelectedItemsController'
import { SubscriptionController } from './Subscription/SubscriptionController'

export class LinkingController extends AbstractViewController {
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
      isLinkingPanelOpen: observable,

      isEntitledToNoteLinking: computed,

      setIsLinkingPanelOpen: action,
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
  }

  get isEntitledToNoteLinking() {
    return !!this.subscriptionController.userSubscription
  }

  setIsLinkingPanelOpen = (open: boolean) => {
    this.isLinkingPanelOpen = open
  }

  get activeItem() {
    return this.application.itemControllerGroup.activeItemViewController?.item
  }

  getFilesLinksForItem = (item: LinkableItem | undefined) => {
    if (!item || this.application.items.isTemplateItem(item)) {
      return {
        filesLinkedToItem: [],
        filesLinkingToItem: [],
      }
    }

    const referencesOfItem = naturalSort(this.application.items.referencesForItem(item).filter(isFile), 'title')

    const referencingItem = naturalSort(this.application.items.itemsReferencingItem(item).filter(isFile), 'title')

    if (item.content_type === ContentType.File) {
      return {
        filesLinkedToItem: referencesOfItem.map((item) => createLinkFromItem(item, 'linked')),
        filesLinkingToItem: referencingItem.map((item) => createLinkFromItem(item, 'linked-by')),
      }
    } else {
      return {
        filesLinkedToItem: referencingItem.map((item) => createLinkFromItem(item, 'linked')),
        filesLinkingToItem: referencesOfItem.map((item) => createLinkFromItem(item, 'linked-by')),
      }
    }
  }

  getLinkedTagsForItem = (item: LinkableItem | undefined) => {
    if (!item) {
      return
    }

    return this.application.items.getSortedTagsForItem(item).map((tag) => createLinkFromItem(tag, 'linked'))
  }

  getLinkedNotesForItem = (item: LinkableItem | undefined) => {
    if (!item || this.application.items.isTemplateItem(item)) {
      return []
    }

    return naturalSort(this.application.items.referencesForItem(item).filter(isNote), 'title').map((item) =>
      createLinkFromItem(item, 'linked'),
    )
  }

  getNotesLinkingToItem = (item: LinkableItem | undefined) => {
    if (!item) {
      return []
    }

    return naturalSort(this.application.items.itemsReferencingItem(item).filter(isNote), 'title').map((item) =>
      createLinkFromItem(item, 'linked-by'),
    )
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
        type: FileItemActionType.PreviewFile,
        payload: {
          file: item,
          otherFiles: [],
        },
      })
    }

    return undefined
  }

  unlinkItems = async (item: LinkableItem, itemToUnlink: LinkableItem) => {
    await this.application.items.unlinkItems(item, itemToUnlink)

    void this.application.sync.sync()
  }

  unlinkItemFromSelectedItem = async (itemToUnlink: LinkableItem) => {
    const selectedItem = this.selectionController.firstSelectedItem

    if (!selectedItem) {
      return
    }

    void this.unlinkItems(selectedItem, itemToUnlink)
  }

  ensureActiveItemIsInserted = async () => {
    const activeItemController = this.itemListController.getActiveItemController()
    if (activeItemController instanceof NoteViewController && activeItemController.isTemplateNote) {
      await activeItemController.insertTemplatedNote()
    }
  }

  linkItems = async (item: LinkableItem, itemToLink: LinkableItem) => {
    if (item instanceof SNNote) {
      if (itemToLink instanceof SNNote && !this.isEntitledToNoteLinking) {
        void this.publishCrossControllerEventSync(CrossControllerEvent.DisplayPremiumModal, {
          featureName: 'Note linking',
        })
        return
      }

      if (item.uuid === this.activeItem?.uuid) {
        await this.ensureActiveItemIsInserted()
      }

      if (itemToLink instanceof FileItem) {
        await this.application.items.associateFileWithNote(itemToLink, item)
      } else if (itemToLink instanceof SNNote) {
        await this.application.items.linkNoteToNote(item, itemToLink)
      } else if (itemToLink instanceof SNTag) {
        await this.addTagToItem(itemToLink, item)
      } else {
        throw Error('Invalid item type')
      }
    } else if (item instanceof FileItem) {
      if (itemToLink instanceof SNNote) {
        await this.application.items.associateFileWithNote(item, itemToLink)
      } else if (itemToLink instanceof FileItem) {
        await this.application.items.linkFileToFile(item, itemToLink)
      } else if (itemToLink instanceof SNTag) {
        await this.addTagToItem(itemToLink, item)
      } else {
        throw Error('Invalid item to link')
      }
    } else {
      throw new Error('First item must be a note or file')
    }

    void this.application.sync.sync()
  }

  linkItemToSelectedItem = async (itemToLink: LinkableItem): Promise<boolean> => {
    const cannotLinkItem = !this.isEntitledToNoteLinking && itemToLink instanceof SNNote
    if (cannotLinkItem) {
      void this.publishCrossControllerEventSync(CrossControllerEvent.DisplayPremiumModal, {
        featureName: 'Note linking',
      })
      return false
    }

    await this.ensureActiveItemIsInserted()
    const activeItem = this.activeItem

    if (!activeItem) {
      return false
    }

    await this.linkItems(activeItem, itemToLink)
    return true
  }

  createAndAddNewTag = async (title: string): Promise<SNTag> => {
    await this.ensureActiveItemIsInserted()
    const activeItem = this.activeItem
    const newTag = await this.application.mutator.findOrCreateTag(title)
    if (activeItem) {
      await this.addTagToItem(newTag, activeItem)
    }

    return newTag
  }

  addTagToItem = async (tag: SNTag, item: FileItem | SNNote) => {
    if (item instanceof SNNote) {
      await this.application.items.addTagToNote(item, tag, this.shouldLinkToParentFolders)
    } else if (item instanceof FileItem) {
      await this.application.items.addTagToFile(item, tag, this.shouldLinkToParentFolders)
    }

    this.application.sync.sync().catch(console.error)
  }
}
