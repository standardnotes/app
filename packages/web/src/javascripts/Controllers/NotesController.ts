import { destroyAllObjectProperties } from '@/Utils'
import { confirmDialog } from '@standardnotes/ui-services'
import { StringEmptyTrash, Strings, StringUtils } from '@/Constants/Strings'
import { MENU_MARGIN_FROM_APP_BORDER } from '@/Constants/Constants'
import { SNNote, NoteMutator, ContentType, SNTag, TagMutator, InternalEventBus } from '@standardnotes/snjs'
import { makeObservable, observable, action, computed, runInAction } from 'mobx'
import { WebApplication } from '../Application/Application'
import { AbstractViewController } from './Abstract/AbstractViewController'
import { SelectedItemsController } from './SelectedItemsController'
import { ItemListController } from './ItemList/ItemListController'
import { NavigationController } from './Navigation/NavigationController'

export class NotesController extends AbstractViewController {
  lastSelectedNote: SNNote | undefined
  contextMenuOpen = false
  contextMenuPosition: { top?: number; left: number; bottom?: number } = {
    top: 0,
    left: 0,
  }
  contextMenuClickLocation: { x: number; y: number } = { x: 0, y: 0 }
  contextMenuMaxHeight: number | 'auto' = 'auto'
  showProtectedWarning = false
  private itemListController!: ItemListController

  override deinit() {
    super.deinit()
    ;(this.lastSelectedNote as unknown) = undefined
    ;(this.selectionController as unknown) = undefined
    ;(this.navigationController as unknown) = undefined
    ;(this.itemListController as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  constructor(
    application: WebApplication,
    private selectionController: SelectedItemsController,
    private navigationController: NavigationController,
    eventBus: InternalEventBus,
  ) {
    super(application, eventBus)

    makeObservable(this, {
      contextMenuOpen: observable,
      contextMenuPosition: observable,
      showProtectedWarning: observable,

      selectedNotes: computed,
      firstSelectedNote: computed,
      selectedNotesCount: computed,
      trashedNotesCount: computed,

      setContextMenuOpen: action,
      setContextMenuClickLocation: action,
      setContextMenuPosition: action,
      setContextMenuMaxHeight: action,
      setShowProtectedWarning: action,
      unselectNotes: action,
    })
  }

  public setServicesPostConstruction(itemListController: ItemListController) {
    this.itemListController = itemListController

    this.disposers.push(
      this.application.streamItems<SNNote>(ContentType.Note, ({ removed }) => {
        runInAction(() => {
          for (const removedNote of removed) {
            this.selectionController.deselectItem(removedNote)
          }
        })
      }),

      this.application.itemControllerGroup.addActiveControllerChangeObserver(() => {
        const controllers = this.application.itemControllerGroup.itemControllers

        const activeNoteUuids = controllers.map((controller) => controller.item.uuid)

        const selectedUuids = this.getSelectedNotesList().map((n) => n.uuid)

        for (const selectedId of selectedUuids) {
          if (!activeNoteUuids.includes(selectedId)) {
            this.selectionController.deselectItem({ uuid: selectedId })
          }
        }
      }),
    )
  }

  public get selectedNotes(): SNNote[] {
    return this.selectionController.getSelectedItems<SNNote>(ContentType.Note)
  }

  get firstSelectedNote(): SNNote | undefined {
    return Object.values(this.selectedNotes)[0]
  }

  get selectedNotesCount(): number {
    if (this.dealloced) {
      return 0
    }

    return Object.keys(this.selectedNotes).length
  }

  get trashedNotesCount(): number {
    return this.application.items.trashedItems.length
  }

  setContextMenuOpen = (open: boolean) => {
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
    const maxContextMenuHeight = parseFloat(defaultFontSize) * 30
    const footerElementRect = document.getElementById('footer-bar')?.getBoundingClientRect()
    const footerHeightInPx = footerElementRect?.height

    // Open up-bottom is default behavior
    let openUpBottom = true

    if (footerHeightInPx) {
      const bottomSpace = clientHeight - footerHeightInPx - this.contextMenuClickLocation.y
      const upSpace = this.contextMenuClickLocation.y

      // If not enough space to open up-bottom
      if (maxContextMenuHeight > bottomSpace) {
        // If there's enough space, open bottom-up
        if (upSpace > maxContextMenuHeight) {
          openUpBottom = false
          this.setContextMenuMaxHeight('auto')
          // Else, reduce max height (menu will be scrollable) and open in whichever direction there's more space
        } else {
          if (upSpace > bottomSpace) {
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

  async changeSelectedNotes(mutate: (mutator: NoteMutator) => void): Promise<void> {
    await this.application.mutator.changeItems(this.getSelectedNotesList(), mutate, false)
    this.application.sync.sync().catch(console.error)
  }

  setHideSelectedNotePreviews(hide: boolean): void {
    this.changeSelectedNotes((mutator) => {
      mutator.hidePreview = hide
    }).catch(console.error)
  }

  setLockSelectedNotes(lock: boolean): void {
    this.changeSelectedNotes((mutator) => {
      mutator.locked = lock
    }).catch(console.error)
  }

  async setTrashSelectedNotes(trashed: boolean): Promise<void> {
    if (trashed) {
      const notesDeleted = await this.deleteNotes(false)
      if (notesDeleted) {
        runInAction(() => {
          this.contextMenuOpen = false
        })
      }
    } else {
      await this.changeSelectedNotes((mutator) => {
        mutator.trashed = trashed
      })
      runInAction(() => {
        this.contextMenuOpen = false
      })
    }
  }

  async deleteNotesPermanently(): Promise<void> {
    await this.deleteNotes(true)
  }

  async deleteNotes(permanently: boolean): Promise<boolean> {
    if (this.getSelectedNotesList().some((note) => note.locked)) {
      const text = StringUtils.deleteLockedNotesAttempt(this.selectedNotesCount)
      this.application.alertService.alert(text).catch(console.error)
      return false
    }

    const title = Strings.trashItemsTitle
    let noteTitle = undefined
    if (this.selectedNotesCount === 1) {
      const selectedNote = this.getSelectedNotesList()[0]
      noteTitle = selectedNote.title.length ? `'${selectedNote.title}'` : 'this note'
    }
    const text = StringUtils.deleteNotes(permanently, this.selectedNotesCount, noteTitle)

    if (
      await confirmDialog({
        title,
        text,
        confirmButtonStyle: 'danger',
      })
    ) {
      this.selectionController.selectNextItem()
      if (permanently) {
        for (const note of this.getSelectedNotesList()) {
          await this.application.mutator.deleteItem(note)
        }
      } else {
        await this.changeSelectedNotes((mutator) => {
          mutator.trashed = true
        })
      }
      return true
    }

    return false
  }

  setPinSelectedNotes(pinned: boolean): void {
    this.changeSelectedNotes((mutator) => {
      mutator.pinned = pinned
    }).catch(console.error)
  }

  async setArchiveSelectedNotes(archived: boolean): Promise<void> {
    if (this.getSelectedNotesList().some((note) => note.locked)) {
      this.application.alertService
        .alert(StringUtils.archiveLockedNotesAttempt(archived, this.selectedNotesCount))
        .catch(console.error)
      return
    }

    await this.changeSelectedNotes((mutator) => {
      mutator.archived = archived
    })

    runInAction(() => {
      this.selectionController.deselectAll()
      this.contextMenuOpen = false
    })
  }

  async setProtectSelectedNotes(protect: boolean): Promise<void> {
    const selectedNotes = this.getSelectedNotesList()
    if (protect) {
      await this.application.mutator.protectNotes(selectedNotes)
      this.setShowProtectedWarning(true)
    } else {
      await this.application.mutator.unprotectNotes(selectedNotes)
      this.setShowProtectedWarning(false)
    }
  }

  unselectNotes(): void {
    this.selectionController.deselectAll()
  }

  getSpellcheckStateForNote(note: SNNote) {
    return note.spellcheck != undefined ? note.spellcheck : this.application.isGlobalSpellcheckEnabled()
  }

  async toggleGlobalSpellcheckForNote(note: SNNote) {
    await this.application.mutator.changeItem<NoteMutator>(
      note,
      (mutator) => {
        mutator.toggleSpellcheck()
      },
      false,
    )
    this.application.sync.sync().catch(console.error)
  }

  async addTagToSelectedNotes(tag: SNTag): Promise<void> {
    const selectedNotes = this.getSelectedNotesList()
    const parentChainTags = this.application.items.getTagParentChain(tag)
    const tagsToAdd = [...parentChainTags, tag]
    await Promise.all(
      tagsToAdd.map(async (tag) => {
        await this.application.mutator.changeItem<TagMutator>(tag, (mutator) => {
          for (const note of selectedNotes) {
            mutator.addNote(note)
          }
        })
      }),
    )
    this.application.sync.sync().catch(console.error)
  }

  async removeTagFromSelectedNotes(tag: SNTag): Promise<void> {
    const selectedNotes = this.getSelectedNotesList()
    await this.application.mutator.changeItem(tag, (mutator) => {
      for (const note of selectedNotes) {
        mutator.removeItemAsRelationship(note)
      }
    })
    this.application.sync.sync().catch(console.error)
  }

  isTagInSelectedNotes(tag: SNTag): boolean {
    const selectedNotes = this.getSelectedNotesList()
    return selectedNotes.every((note) =>
      this.application.getItemTags(note).find((noteTag) => noteTag.uuid === tag.uuid),
    )
  }

  setShowProtectedWarning(show: boolean): void {
    this.showProtectedWarning = show
  }

  async emptyTrash(): Promise<void> {
    if (
      await confirmDialog({
        text: StringEmptyTrash(this.trashedNotesCount),
        confirmButtonStyle: 'danger',
      })
    ) {
      this.application.mutator.emptyTrash().catch(console.error)
      this.application.sync.sync().catch(console.error)
    }
  }

  private getSelectedNotesList(): SNNote[] {
    return Object.values(this.selectedNotes)
  }
}
