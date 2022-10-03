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
import { action, computed, makeObservable, observable, reaction } from 'mobx'
import { AbstractViewController } from './Abstract/AbstractViewController'
import { FilesController } from './FilesController'
import { NavigationController } from './Navigation/NavigationController'
import { NoteTagsController } from './NoteTagsController'
import { SelectedItemsController } from './SelectedItemsController'

export type LinkableItem = DecryptedItemInterface<ItemContent>

export class LinkingController extends AbstractViewController {
  tags: SNTag[] = []
  files: FileItem[] = []
  notes: SNNote[] = []
  shouldLinkToParentFolders: boolean
  isLinkingPanelOpen = false

  constructor(
    application: WebApplication,
    private noteTagsController: NoteTagsController,
    private navigationController: NavigationController,
    private selectionController: SelectedItemsController,
    private filesController: FilesController,
    eventBus: InternalEventBus,
  ) {
    super(application, eventBus)

    makeObservable(this, {
      tags: observable,
      files: observable,
      notes: observable,
      isLinkingPanelOpen: observable,

      allLinkedItems: computed,

      setIsLinkingPanelOpen: action,
      reloadLinkedFiles: action,
      reloadLinkedTags: action,
      reloadLinkedNotes: action,
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

    this.disposers.push(
      application.streamItems(ContentType.File, () => {
        this.reloadLinkedFiles()
      }),
      application.streamItems(ContentType.Tag, () => {
        this.reloadLinkedTags()
      }),
      application.streamItems(ContentType.Note, () => {
        this.reloadLinkedNotes()
      }),
    )

    this.disposers.push(
      reaction(
        () => selectionController.firstSelectedItem,
        () => {
          this.reloadLinkedFiles()
          this.reloadLinkedTags()
          this.reloadLinkedNotes()
        },
      ),
    )
  }

  setIsLinkingPanelOpen = (open: boolean) => {
    this.isLinkingPanelOpen = open
  }

  get allLinkedItems() {
    return [...this.tags, ...this.files, ...this.notes]
  }

  reloadLinkedFiles() {
    const activeItem = this.selectionController.firstSelectedItem
    if (activeItem) {
      const files = this.application.items.getSortedFilesForItem(activeItem)
      this.files = files
    }
  }

  reloadLinkedTags() {
    const activeItem = this.selectionController.firstSelectedItem

    if (activeItem) {
      const tags = this.application.items.getSortedTagsForItem(activeItem)
      this.tags = tags
    }
  }

  reloadLinkedNotes() {
    const activeItem = this.selectionController.firstSelectedItem

    if (activeItem) {
      const notes = this.application.items.getSortedNotesForItem(activeItem)
      this.notes = notes
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
    }

    if (item instanceof FileItem) {
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
    }

    if (item instanceof SNNote) {
      await this.navigationController.selectHomeNavigationView()
      const { didSelect } = await this.selectionController.selectItem(item.uuid, true)
      if (didSelect) {
        return AppPaneId.Editor
      }
    }

    if (item instanceof FileItem) {
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
  }

  linkItemToSelectedItem = async (itemToLink: LinkableItem) => {
    const selectedItem = this.selectionController.firstSelectedItem

    if (!selectedItem) {
      return
    }

    if (selectedItem instanceof SNNote) {
      if (itemToLink instanceof SNTag) {
        await this.application.items.addTagToNote(selectedItem, itemToLink, this.shouldLinkToParentFolders)
      }
      if (itemToLink instanceof FileItem) {
        await this.application.items.associateFileWithNote(itemToLink, selectedItem)
      }
      if (itemToLink instanceof SNNote) {
        await this.application.items.linkNoteToNote(itemToLink, selectedItem)
      }
    }

    if (selectedItem instanceof FileItem) {
      if (itemToLink instanceof SNTag) {
        await this.application.items.addTagToFile(selectedItem, itemToLink, this.shouldLinkToParentFolders)
      }
      if (itemToLink instanceof SNNote) {
        await this.application.items.associateFileWithNote(selectedItem, itemToLink)
      }
      if (itemToLink instanceof FileItem) {
        await this.application.items.linkFileToFile(itemToLink, selectedItem)
      }
    }

    void this.application.sync.sync()
  }

  createAndAddNewTag = (title: string) => this.noteTagsController.createAndAddNewTag(title)

  getSearchResults = (searchQuery: string) => {
    if (!searchQuery.length) {
      return {
        linkedResults: [],
        unlinkedResults: [],
        shouldShowCreateTag: false,
      }
    }

    const activeItem = this.selectionController.firstSelectedItem

    if (!activeItem) {
      throw new Error('Cannot search if no item is selected.')
    }

    const searchResults = this.application.items
      .getItems([ContentType.Note, ContentType.File, ContentType.Tag])
      .filter((item) => {
        const title = item instanceof SNTag ? this.application.items.getTagLongTitle(item) : item.title
        const matchesQuery = title?.toLowerCase().includes(searchQuery.toLowerCase())
        const isNotActiveItem = activeItem.uuid !== item.uuid
        return matchesQuery && isNotActiveItem
      })

    const isAlreadyLinked = (item: LinkableItem) => {
      const isActiveItemReferencedByItem = this.application.items
        .itemsReferencingItem(activeItem)
        .some((linkedItem) => linkedItem.uuid === item.uuid)
      const isItemReferencedByActiveItem = this.application.items
        .itemsReferencingItem(item)
        .some((linkedItem) => linkedItem.uuid === activeItem.uuid)
      const isAlreadyLinkedToItem = isActiveItemReferencedByItem || isItemReferencedByActiveItem
      return isAlreadyLinkedToItem
    }

    const unlinkedResults = naturalSort(
      searchResults.filter((item) => !isAlreadyLinked(item)),
      'title',
    )
    const linkedResults = naturalSort(searchResults.filter(isAlreadyLinked), 'title')
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
