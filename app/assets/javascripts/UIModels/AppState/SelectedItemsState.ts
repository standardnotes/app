import { ListableContentItem } from '@/Components/ContentListView/Types/ListableContentItem'
import { ChallengeReason, ContentType, KeyboardModifier, FileItem, SNNote, UuidString } from '@standardnotes/snjs'
import { action, computed, makeObservable, observable, runInAction } from 'mobx'
import { WebApplication } from '../Application'
import { AbstractState } from './AbstractState'
import { AppState } from './AppState'

type SelectedItems = Record<UuidString, ListableContentItem>

export class SelectedItemsState extends AbstractState {
  lastSelectedItem: ListableContentItem | undefined
  selectedItems: SelectedItems = {}

  constructor(application: WebApplication, override appState: AppState, appObservers: (() => void)[]) {
    super(application)

    makeObservable(this, {
      selectedItems: observable,

      selectedItemsCount: computed,

      selectItem: action,
      setSelectedItems: action,
    })

    appObservers.push(
      application.streamItems<SNNote>(ContentType.Note, ({ changed, inserted, removed }) => {
        runInAction(() => {
          for (const removedNote of removed) {
            delete this.selectedItems[removedNote.uuid]
          }

          for (const note of [...changed, ...inserted]) {
            if (this.selectedItems[note.uuid]) {
              this.selectedItems[note.uuid] = note
            }
          }
        })
      }),
      application.streamItems<FileItem>(ContentType.File, ({ changed, inserted, removed }) => {
        runInAction(() => {
          for (const removedFile of removed) {
            delete this.selectedItems[removedFile.uuid]
          }

          for (const file of [...changed, ...inserted]) {
            if (this.selectedItems[file.uuid]) {
              this.selectedItems[file.uuid] = file
            }
          }
        })
      }),
    )
  }

  private get io() {
    return this.application.io
  }

  get selectedItemsCount(): number {
    return Object.keys(this.selectedItems).length
  }

  setSelectedItems = (selectedItems: SelectedItems) => {
    this.selectedItems = selectedItems
  }

  private selectItemsRange = async (selectedItem: ListableContentItem): Promise<void> => {
    const items = this.appState.contentListView.renderedItems

    const lastSelectedItemIndex = items.findIndex((item) => item.uuid == this.lastSelectedItem?.uuid)
    const selectedItemIndex = items.findIndex((item) => item.uuid == selectedItem.uuid)

    let itemsToSelect = []
    if (selectedItemIndex > lastSelectedItemIndex) {
      itemsToSelect = items.slice(lastSelectedItemIndex, selectedItemIndex + 1)
    } else {
      itemsToSelect = items.slice(selectedItemIndex, lastSelectedItemIndex + 1)
    }

    /** @TODO */
    const authorizedItems = await this.application.authorizeProtectedActionForNotes(
      itemsToSelect as SNNote[],
      ChallengeReason.SelectProtectedNote,
    )

    for (const item of authorizedItems) {
      runInAction(() => {
        this.selectedItems[item.uuid] = item
        this.lastSelectedItem = item
      })
    }
  }

  selectItem = async (uuid: UuidString, userTriggered?: boolean): Promise<void> => {
    const item = this.application.items.findItem<ListableContentItem>(uuid)
    if (!item) {
      return
    }

    const hasMeta = this.io.activeModifiers.has(KeyboardModifier.Meta)
    const hasCtrl = this.io.activeModifiers.has(KeyboardModifier.Ctrl)
    const hasShift = this.io.activeModifiers.has(KeyboardModifier.Shift)

    if (userTriggered && (hasMeta || hasCtrl)) {
      if (this.selectedItems[uuid]) {
        delete this.selectedItems[uuid]
      } else if (await this.application.authorizeNoteAccess(item as SNNote)) {
        this.selectedItems[uuid] = item
        this.lastSelectedItem = item
      }
    } else if (userTriggered && hasShift) {
      await this.selectItemsRange(item)
    } else {
      const shouldSelectNote = this.selectedItemsCount > 1 || !this.selectedItems[uuid]
      if (shouldSelectNote && (await this.application.authorizeNoteAccess(item as SNNote))) {
        this.setSelectedItems({
          [item.uuid]: item,
        })
        this.lastSelectedItem = item
      }
    }

    if (this.selectedItemsCount === 1) {
      const item = Object.values(this.selectedItems)[0]
      if (item.content_type === ContentType.Note) {
        await this.appState.notes.openNote(item.uuid)
      }
    }
  }
}
