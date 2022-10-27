import { ListableContentItem } from '@/Components/ContentListView/Types/ListableContentItem'
import {
  ChallengeReason,
  ContentType,
  KeyboardModifier,
  FileItem,
  SNNote,
  UuidString,
  InternalEventBus,
  isFile,
  SelectionControllerPersistableValue,
} from '@standardnotes/snjs'
import { action, computed, makeObservable, observable, reaction, runInAction } from 'mobx'
import { WebApplication } from '../Application/Application'
import { AbstractViewController } from './Abstract/AbstractViewController'
import { Persistable } from './Abstract/Persistable'
import { CrossControllerEvent } from './CrossControllerEvent'
import { ItemListController } from './ItemList/ItemListController'

export class SelectedItemsController
  extends AbstractViewController
  implements Persistable<SelectionControllerPersistableValue>
{
  lastSelectedItem: ListableContentItem | undefined
  selectedUuids: Set<UuidString> = observable(new Set<UuidString>())
  selectedItems: Record<UuidString, ListableContentItem> = {}
  private itemListController!: ItemListController

  override deinit(): void {
    super.deinit()
    ;(this.itemListController as unknown) = undefined
  }

  constructor(application: WebApplication, eventBus: InternalEventBus) {
    super(application, eventBus)

    makeObservable(this, {
      selectedUuids: observable,
      selectedItems: observable,

      selectedItemsCount: computed,
      selectedFiles: computed,
      selectedFilesCount: computed,
      firstSelectedItem: computed,

      selectItem: action,
      setSelectedUuids: action,
      setSelectedItems: action,

      hydrateFromPersistedValue: action,
    })

    this.disposers.push(
      reaction(
        () => this.selectedUuids,
        () => {
          eventBus.publish({
            type: CrossControllerEvent.RequestValuePersistence,
            payload: undefined,
          })
        },
      ),
    )
  }

  getPersistableValue = (): SelectionControllerPersistableValue => {
    return {
      selectedUuids: Array.from(this.selectedUuids),
    }
  }

  hydrateFromPersistedValue = (state: SelectionControllerPersistableValue | undefined): void => {
    if (!state) {
      return
    }
    if (!this.selectedUuids.size && state.selectedUuids.length > 0) {
      void this.selectUuids(state.selectedUuids)
    }
  }

  public setServicesPostConstruction(itemListController: ItemListController) {
    this.itemListController = itemListController

    this.disposers.push(
      this.application.streamItems<SNNote | FileItem>(
        [ContentType.Note, ContentType.File],
        ({ changed, inserted, removed }) => {
          runInAction(() => {
            for (const removedItem of removed) {
              this.removeSelectedItem(removedItem.uuid)
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
    return this.getFilteredSelectedItems<FileItem>(ContentType.File)
  }

  get selectedFilesCount(): number {
    return this.selectedFiles.length
  }

  get firstSelectedItem() {
    return Object.values(this.selectedItems)[0]
  }

  getSelectedItems = () => {
    const uuids = Array.from(this.selectedUuids)
    return uuids.map((uuid) => this.application.items.findSureItem<SNNote | FileItem>(uuid)).filter((item) => !!item)
  }

  getFilteredSelectedItems = <T extends ListableContentItem = ListableContentItem>(contentType?: ContentType): T[] => {
    return Object.values(this.selectedItems).filter((item) => {
      return !contentType ? true : item.content_type === contentType
    }) as T[]
  }

  setSelectedItems = () => {
    this.selectedItems = Object.fromEntries(this.getSelectedItems().map((item) => [item.uuid, item]))
  }

  setSelectedUuids = (selectedUuids: Set<UuidString>) => {
    this.selectedUuids = new Set(selectedUuids)
    this.setSelectedItems()
  }

  private removeSelectedItem = (uuid: UuidString) => {
    this.selectedUuids.delete(uuid)
    this.setSelectedUuids(this.selectedUuids)
    delete this.selectedItems[uuid]
  }

  public deselectItem = (item: { uuid: ListableContentItem['uuid'] }): void => {
    this.removeSelectedItem(item.uuid)

    if (item.uuid === this.lastSelectedItem?.uuid) {
      this.lastSelectedItem = undefined
    }
  }

  public isItemSelected = (item: ListableContentItem): boolean => {
    return this.selectedUuids.has(item.uuid)
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
        this.setSelectedUuids(this.selectedUuids.add(item.uuid))
        this.lastSelectedItem = item
      })
    }
  }

  cancelMultipleSelection = () => {
    this.io.cancelAllKeyboardModifiers()

    const firstSelectedItem = this.firstSelectedItem

    if (firstSelectedItem) {
      this.replaceSelection(firstSelectedItem)
    } else {
      this.deselectAll()
    }
  }

  private replaceSelection = (item: ListableContentItem): void => {
    this.deselectAll()
    runInAction(() => this.setSelectedUuids(this.selectedUuids.add(item.uuid)))

    this.lastSelectedItem = item
  }

  selectAll = () => {
    void this.selectItemsRange({
      startingIndex: 0,
      endingIndex: this.itemListController.listLength - 1,
    })
  }

  deselectAll = (): void => {
    this.selectedUuids.clear()
    this.setSelectedUuids(this.selectedUuids)

    this.lastSelectedItem = undefined
  }

  openSingleSelectedItem = async () => {
    if (this.selectedItemsCount === 1) {
      const item = this.firstSelectedItem

      if (item.content_type === ContentType.Note) {
        await this.itemListController.openNote(item.uuid)
      } else if (item.content_type === ContentType.File) {
        await this.itemListController.openFile(item.uuid)
      }
    }
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
      if (this.selectedUuids.has(uuid) && hasMoreThanOneSelected) {
        this.removeSelectedItem(uuid)
      } else if (isAuthorizedForAccess) {
        this.setSelectedUuids(this.selectedUuids.add(uuid))
        this.lastSelectedItem = item
      }
    } else if (userTriggered && hasShift) {
      await this.selectItemsRange({ selectedItem: item })
    } else {
      const shouldSelectNote = hasMoreThanOneSelected || !this.selectedUuids.has(uuid)
      if (shouldSelectNote && isAuthorizedForAccess) {
        this.replaceSelection(item)
      }
    }

    await this.openSingleSelectedItem()

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

  selectUuids = async (uuids: UuidString[], userTriggered = false) => {
    const itemsForUuids = this.application.items.findItems(uuids)
    if (itemsForUuids.length < 1) {
      return
    }
    if (!userTriggered && itemsForUuids.some((item) => item.protected && isFile(item))) {
      return
    }
    this.setSelectedUuids(new Set(uuids))
    if (itemsForUuids.length === 1) {
      void this.openSingleSelectedItem()
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
