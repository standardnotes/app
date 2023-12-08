import { FileItemActionType } from '@/Components/AttachedFilesPopover/PopoverFileItemAction'
import { NoteViewController } from '@/Components/NoteView/Controller/NoteViewController'
import { AppPaneId } from '@/Components/Panes/AppPaneMetadata'

import { createLinkFromItem } from '@/Utils/Items/Search/createLinkFromItem'
import { LinkableItem } from '@/Utils/Items/Search/LinkableItem'
import {
  ApplicationEvent,
  ContentType,
  FileItem,
  naturalSort,
  PrefKey,
  SNNote,
  SNTag,
  isFile,
  isNote,
  InternalEventBusInterface,
  isTag,
  PrefDefaults,
  PreferenceServiceInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
  ItemManagerInterface,
  MutatorClientInterface,
  SyncServiceInterface,
  VaultServiceInterface,
} from '@standardnotes/snjs'
import { action, computed, makeObservable, observable } from 'mobx'
import { AbstractViewController } from './Abstract/AbstractViewController'
import { CrossControllerEvent } from './CrossControllerEvent'
import { FilesController } from './FilesController'
import { ItemListController } from './ItemList/ItemListController'
import { NavigationController } from './Navigation/NavigationController'
import { SubscriptionController } from './Subscription/SubscriptionController'
import { ItemGroupController } from '@/Components/NoteView/Controller/ItemGroupController'
import { VaultDisplayServiceInterface } from '@standardnotes/ui-services'
import { FeaturesController } from './FeaturesController'

export class LinkingController extends AbstractViewController implements InternalEventHandlerInterface {
  shouldLinkToParentFolders: boolean
  isLinkingPanelOpen = false

  constructor(
    private itemListController: ItemListController,
    private filesController: FilesController,
    private subscriptionController: SubscriptionController,
    private navigationController: NavigationController,
    private featuresController: FeaturesController,
    private itemControllerGroup: ItemGroupController,
    private vaultDisplayService: VaultDisplayServiceInterface,
    private preferences: PreferenceServiceInterface,
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
    private vaults: VaultServiceInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    makeObservable(this, {
      isLinkingPanelOpen: observable,

      isEntitledToNoteLinking: computed,

      setIsLinkingPanelOpen: action,
    })

    this.shouldLinkToParentFolders = preferences.getValue(
      PrefKey.NoteAddToParentFolders,
      PrefDefaults[PrefKey.NoteAddToParentFolders],
    )

    eventBus.addEventHandler(this, ApplicationEvent.PreferencesChanged)
  }

  handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case ApplicationEvent.PreferencesChanged: {
        this.shouldLinkToParentFolders = this.preferences.getValue(
          PrefKey.NoteAddToParentFolders,
          PrefDefaults[PrefKey.NoteAddToParentFolders],
        )
        break
      }
    }

    return Promise.resolve()
  }

  get isEntitledToNoteLinking() {
    return this.subscriptionController.hasFirstPartyOnlineOrOfflineSubscription()
  }

  setIsLinkingPanelOpen = (open: boolean) => {
    this.isLinkingPanelOpen = open
  }

  get activeItem() {
    return this.itemControllerGroup.activeItemViewController?.item
  }

  getFilesLinksForItem = (item: LinkableItem | undefined) => {
    if (!item || this.items.isTemplateItem(item)) {
      return {
        filesLinkedToItem: [],
        filesLinkingToItem: [],
      }
    }

    const referencesOfItem = naturalSort(this.items.referencesForItem(item).filter(isFile), 'title')

    const referencingItem = naturalSort(this.items.itemsReferencingItem(item).filter(isFile), 'title')

    if (item.content_type === ContentType.TYPES.File) {
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

    return this.items.getSortedTagsForItem(item).map((tag) => createLinkFromItem(tag, 'linked'))
  }

  getLinkedNotesForItem = (item: LinkableItem | undefined) => {
    if (!item || this.items.isTemplateItem(item)) {
      return []
    }

    return naturalSort(this.items.referencesForItem(item).filter(isNote), 'title').map((item) =>
      createLinkFromItem(item, 'linked'),
    )
  }

  getNotesLinkingToItem = (item: LinkableItem | undefined) => {
    if (!item) {
      return []
    }

    return naturalSort(this.items.itemsReferencingItem(item).filter(isNote), 'title').map((item) =>
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
      const { didSelect } = await this.itemListController.selectItem(item.uuid, true)
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
    try {
      await this.mutator.unlinkItems(item, itemToUnlink)
    } catch (error) {
      console.error(error)
    }

    void this.sync.sync()
  }

  unlinkItemFromSelectedItem = async (itemToUnlink: LinkableItem) => {
    const selectedItem = this.itemListController.firstSelectedItem

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

  linkItems = async (item: LinkableItem, itemToLink: LinkableItem, sync = true) => {
    const linkNoteAndFile = async (note: SNNote, file: FileItem) => {
      const updatedFile = await this.mutator.associateFileWithNote(file, note)

      if (this.featuresController.isVaultsEnabled()) {
        if (updatedFile) {
          const noteVault = this.vaults.getItemVault(note)
          const fileVault = this.vaults.getItemVault(updatedFile)
          if (noteVault && !fileVault) {
            const result = await this.vaults.moveItemToVault(noteVault, file)
            if (result.isFailed()) {
              console.error(result.getError())
            }
          }
        }
      }
    }

    const linkFileAndFile = async (file1: FileItem, file2: FileItem) => {
      await this.mutator.linkFileToFile(file1, file2)
    }

    const linkNoteToNote = async (note1: SNNote, note2: SNNote) => {
      await this.mutator.linkNoteToNote(note1, note2)
    }

    const linkTagToNote = async (tag: SNTag, note: SNNote) => {
      await this.addTagToItem(tag, note, sync)
    }

    const linkTagToFile = async (tag: SNTag, file: FileItem) => {
      await this.addTagToItem(tag, file, sync)
    }

    if (isNote(item)) {
      if (isNote(itemToLink) && !this.isEntitledToNoteLinking) {
        void this.publishCrossControllerEventSync(CrossControllerEvent.DisplayPremiumModal, {
          featureName: 'Note linking',
        })
        return
      }

      if (item.uuid === this.activeItem?.uuid) {
        await this.ensureActiveItemIsInserted()
      }

      if (isFile(itemToLink)) {
        await linkNoteAndFile(item, itemToLink)
      } else if (isNote(itemToLink)) {
        await linkNoteToNote(item, itemToLink)
      } else if (isTag(itemToLink)) {
        await linkTagToNote(itemToLink, item)
      } else {
        throw Error('Invalid item type')
      }
    } else if (isFile(item)) {
      if (isNote(itemToLink)) {
        await linkNoteAndFile(itemToLink, item)
      } else if (isFile(itemToLink)) {
        await linkFileAndFile(item, itemToLink)
      } else if (isTag(itemToLink)) {
        await linkTagToFile(itemToLink, item)
      } else {
        throw Error('Invalid item to link')
      }
    } else {
      throw new Error('First item must be a note or file')
    }

    if (sync) {
      void this.sync.sync()
    }
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

    const vault = this.vaultDisplayService.exclusivelyShownVault

    const newTag = await this.mutator.findOrCreateTag(title, vault)

    const activeItem = this.activeItem
    if (activeItem) {
      const itemVault = this.vaults.getItemVault(activeItem)

      if (itemVault) {
        const movedTagOrError = await this.vaults.moveItemToVault(itemVault, newTag)
        if (movedTagOrError.isFailed()) {
          throw new Error(`Failed to move tag to item vault: ${movedTagOrError.getError()}`)
        }
        const movedTag = movedTagOrError.getValue()

        await this.addTagToItem(movedTag as SNTag, activeItem)
      } else {
        await this.addTagToItem(newTag, activeItem)
      }
    }

    return newTag
  }

  addTagToItem = async (tag: SNTag, item: FileItem | SNNote, sync = true) => {
    if (item instanceof SNNote) {
      await this.mutator.addTagToNote(item, tag, this.shouldLinkToParentFolders)
    } else if (item instanceof FileItem) {
      await this.mutator.addTagToFile(item, tag, this.shouldLinkToParentFolders)
    }

    if (sync) {
      this.sync.sync().catch(console.error)
    }
  }
}
