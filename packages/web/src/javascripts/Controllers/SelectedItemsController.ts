import { ListableContentItem } from '@/Components/ContentListView/Types/ListableContentItem'
import {
  ChallengeReason,
  ContentType,
  KeyboardModifier,
  FileItem,
  SNNote,
  UuidString,
  InternalEventBus,
} from '@standardnotes/snjs'
import { action, autorun, computed, makeObservable, observable, runInAction } from 'mobx'
import { WebApplication } from '../Application/Application'
import { AbstractViewController } from './Abstract/AbstractViewController'
import { Persistable } from './Abstract/Persistable'
import { ItemListController } from './ItemList/ItemListController'
import { ViewControllerManager } from './ViewControllerManager'

type SelectedItems = Record<UuidString, ListableContentItem>

type PersistableState = {
  selectedUuids: Set<UuidString>
}

export class SelectedItemsController extends AbstractViewController implements Persistable<PersistableState> {
  lastSelectedItem: ListableContentItem | undefined
  selectedItems: SelectedItems = {}
  selectedUuids: Set<UuidString> = observable(new Set<UuidString>())
  private itemListController!: ItemListController

  override deinit(): void {
    super.deinit()
    ;(this.itemListController as unknown) = undefined
  }

  constructor(application: WebApplication, eventBus: InternalEventBus, viewControllerManager: ViewControllerManager) {
    super(application, eventBus)

    makeObservable(this, {
      selectedItems: observable,
      selectedUuids: observable,

      selectedItemsCount: computed,
      selectedFiles: computed,
      selectedFilesCount: computed,
      firstSelectedItem: computed,

      selectItem: action,
      setSelectedItems: action,
    })

    this.disposers.push(
      autorun(() => {
        const _ = Array.from(this.selectedUuids)
        viewControllerManager.persistValuesToStorage()
      }),
    )
  }

  getPersistableState(): PersistableState {
    return {
      selectedUuids: new Set(this.selectedUuids),
    }
  }

  hydrateFromStorage(state: PersistableState): void {
    this.selectedUuids = observable(new Set(state.selectedUuids))
  }

  public setServicesPostConstruction(itemListController: ItemListController) {
    this.itemListController = itemListController

    this.disposers.push(
      this.application.streamItems<SNNote | FileItem>(
        [ContentType.Note, ContentType.File],
        ({ changed, inserted, removed }) => {
          runInAction(() => {
            for (const removedNote of removed) {
              delete this.selectedItems[removedNote.uuid]
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
  }

  private get io() {
    return this.application.io
  }

  get selectedItemsCount(): number {
    return Object.keys(this.selectedItems).length
  }

  get selectedFiles(): FileItem[] {
    return this.getSelectedItems<FileItem>(ContentType.File)
  }

  get selectedFilesCount(): number {
    return this.selectedFiles.length
  }

  get firstSelectedItem() {
    return this.getSelectedItems()[0]
  }

  getSelectedItems = <T extends ListableContentItem = ListableContentItem>(contentType?: ContentType): T[] => {
    return Object.values(this.selectedItems).filter((item) => {
      return !contentType ? true : item.content_type === contentType
    }) as T[]
  }

  setSelectedItems = (selectedItems: SelectedItems) => {
    this.selectedItems = selectedItems
  }

  public deselectItem = (item: { uuid: ListableContentItem['uuid'] }): void => {
    delete this.selectedItems[item.uuid]

    if (item.uuid === this.lastSelectedItem?.uuid) {
      this.lastSelectedItem = undefined
    }
  }

  public isItemSelected = (item: ListableContentItem): boolean => {
    return this.selectedItems[item.uuid] != undefined
  }

  public updateReferenceOfSelectedItem = (item: ListableContentItem): void => {
    this.selectedItems[item.uuid] = item
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
    const items = this.itemListController.renderedItems

    const lastSelectedItemIndex = startingIndex ?? items.findIndex((item) => item.uuid == this.lastSelectedItem?.uuid)
    const selectedItemIndex = endingIndex ?? items.findIndex((item) => item.uuid == selectedItem?.uuid)

    let itemsToSelect = []
    if (selectedItemIndex > lastSelectedItemIndex) {
      itemsToSelect = items.slice(lastSelectedItemIndex, selectedItemIndex + 1)
    } else {
      itemsToSelect = items.slice(selectedItemIndex, lastSelectedItemIndex + 1)
    }

    const authorizedItems = await this.application.protections.authorizeProtectedActionForItems(
      itemsToSelect,
      ChallengeReason.SelectProtectedNote,
    )

    for (const item of authorizedItems) {
      runInAction(() => {
        this.selectedItems[item.uuid] = item
        this.selectedUuids = observable(new Set(this.selectedUuids.add(item.uuid)))
        this.lastSelectedItem = item
      })
    }
  }

  cancelMultipleSelection = () => {
    this.io.cancelAllKeyboardModifiers()

    const firstSelectedItem = this.getSelectedItems()[0]

    if (firstSelectedItem) {
      this.replaceSelection(firstSelectedItem)
    } else {
      this.deselectAll()
    }
  }

  private replaceSelection = (item: ListableContentItem): void => {
    this.setSelectedItems({
      [item.uuid]: item,
    })

    this.selectedUuids = observable(new Set(this.selectedUuids.add(item.uuid)))

    this.lastSelectedItem = item
  }

  selectAll = () => {
    void this.selectItemsRange({
      startingIndex: 0,
      endingIndex: this.itemListController.listLength - 1,
    })
  }

  private deselectAll = (): void => {
    this.setSelectedItems({})

    this.lastSelectedItem = undefined
  }

  selectItem = async (
    uuid: UuidString,
    userTriggered?: boolean,
  ): Promise<{
    didSelect: boolean
  }> => {
    const item = this.application.items.findItem<ListableContentItem>(uuid)
    if (!item) {
      return {
        didSelect: false,
      }
    }

    const hasMeta = this.io.activeModifiers.has(KeyboardModifier.Meta)
    const hasCtrl = this.io.activeModifiers.has(KeyboardModifier.Ctrl)
    const hasShift = this.io.activeModifiers.has(KeyboardModifier.Shift)
    const hasMoreThanOneSelected = this.selectedItemsCount > 1
    const isAuthorizedForAccess = await this.application.protections.authorizeItemAccess(item)

    if (userTriggered && (hasMeta || hasCtrl)) {
      if (this.selectedItems[uuid] && hasMoreThanOneSelected) {
        delete this.selectedItems[uuid]
        this.selectedUuids.delete(uuid)
        this.selectedUuids = observable(new Set(this.selectedUuids))
      } else if (isAuthorizedForAccess) {
        this.selectedUuids = observable(this.selectedUuids.add(uuid))
        this.selectedItems[uuid] = item
        this.lastSelectedItem = item
      }
    } else if (userTriggered && hasShift) {
      await this.selectItemsRange({ selectedItem: item })
    } else {
      const shouldSelectNote = hasMoreThanOneSelected || !this.selectedItems[uuid]
      if (shouldSelectNote && isAuthorizedForAccess) {
        this.replaceSelection(item)
      }
    }

    if (this.selectedItemsCount === 1) {
      const item = Object.values(this.selectedItems)[0]

      if (item.content_type === ContentType.Note) {
        await this.itemListController.openNote(item.uuid)
      } else if (item.content_type === ContentType.File) {
        await this.itemListController.openFile(item.uuid)
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
    { userTriggered = false, scrollIntoView = true },
  ): Promise<void> => {
    const { didSelect } = await this.selectItem(item.uuid, userTriggered)

    if (didSelect && scrollIntoView) {
      const itemElement = document.getElementById(item.uuid)
      itemElement?.scrollIntoView({
        behavior: 'smooth',
      })
    }
  }

  selectNextItem = () => {
    const displayableItems = this.itemListController.items

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

      this.selectItemWithScrollHandling(nextItem, { userTriggered: true }).catch(console.error)

      const nextNoteElement = document.getElementById(nextItem.uuid)

      nextNoteElement?.focus()

      return
    }
  }

  selectPreviousItem = () => {
    const displayableItems = this.itemListController.items

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
