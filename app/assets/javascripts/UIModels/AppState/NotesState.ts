import { destroyAllObjectProperties } from '@/Utils'
import { confirmDialog } from '@/Services/AlertService'
import { KeyboardModifier } from '@/Services/IOService'
import { StringEmptyTrash, Strings, StringUtils } from '@/Strings'
import { MENU_MARGIN_FROM_APP_BORDER } from '@/Constants'
import {
  UuidString,
  SNNote,
  NoteMutator,
  ContentType,
  SNTag,
  ChallengeReason,
  NoteViewController,
  DeinitSource,
} from '@standardnotes/snjs'
import { makeObservable, observable, action, computed, runInAction } from 'mobx'
import { WebApplication } from '../Application'
import { AppState } from './AppState'
import { AbstractState } from './AbstractState'

export class NotesState extends AbstractState {
  lastSelectedNote: SNNote | undefined
  selectedNotes: Record<UuidString, SNNote> = {}
  contextMenuOpen = false
  contextMenuPosition: { top?: number; left: number; bottom?: number } = {
    top: 0,
    left: 0,
  }
  contextMenuClickLocation: { x: number; y: number } = { x: 0, y: 0 }
  contextMenuMaxHeight: number | 'auto' = 'auto'
  showProtectedWarning = false
  showRevisionHistoryModal = false

  override deinit(source: DeinitSource) {
    super.deinit(source)
    ;(this.lastSelectedNote as unknown) = undefined
    ;(this.selectedNotes as unknown) = undefined
    ;(this.onActiveEditorChanged as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  constructor(
    application: WebApplication,
    public override appState: AppState,
    private onActiveEditorChanged: () => Promise<void>,
    appEventListeners: (() => void)[],
  ) {
    super(application, appState)

    makeObservable(this, {
      selectedNotes: observable,
      contextMenuOpen: observable,
      contextMenuPosition: observable,
      showProtectedWarning: observable,
      showRevisionHistoryModal: observable,

      selectedNotesCount: computed,
      trashedNotesCount: computed,

      setContextMenuOpen: action,
      setContextMenuClickLocation: action,
      setContextMenuPosition: action,
      setContextMenuMaxHeight: action,
      setShowProtectedWarning: action,
      setShowRevisionHistoryModal: action,
      unselectNotes: action,
    })

    appEventListeners.push(
      application.streamItems<SNNote>(ContentType.Note, ({ changed, inserted, removed }) => {
        runInAction(() => {
          for (const removedNote of removed) {
            delete this.selectedNotes[removedNote.uuid]
          }

          for (const note of [...changed, ...inserted]) {
            if (this.selectedNotes[note.uuid]) {
              this.selectedNotes[note.uuid] = note
            }
          }
        })
      }),
    )
  }

  get activeNoteController(): NoteViewController | undefined {
    return this.application.noteControllerGroup.noteControllers[0]
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

  private async selectNotesRange(selectedNote: SNNote): Promise<void> {
    const notes = this.application.items.getDisplayableNotes()

    const lastSelectedNoteIndex = notes.findIndex((note) => note.uuid == this.lastSelectedNote?.uuid)
    const selectedNoteIndex = notes.findIndex((note) => note.uuid == selectedNote.uuid)

    let notesToSelect = []
    if (selectedNoteIndex > lastSelectedNoteIndex) {
      notesToSelect = notes.slice(lastSelectedNoteIndex, selectedNoteIndex + 1)
    } else {
      notesToSelect = notes.slice(selectedNoteIndex, lastSelectedNoteIndex + 1)
    }

    const authorizedNotes = await this.application.authorizeProtectedActionForNotes(
      notesToSelect,
      ChallengeReason.SelectProtectedNote,
    )

    for (const note of authorizedNotes) {
      runInAction(() => {
        this.selectedNotes[note.uuid] = note
        this.lastSelectedNote = note
      })
    }
  }

  async selectNote(uuid: UuidString, userTriggered?: boolean): Promise<void> {
    const note = this.application.items.findItem(uuid) as SNNote
    if (!note) {
      return
    }

    const hasMeta = this.io.activeModifiers.has(KeyboardModifier.Meta)
    const hasCtrl = this.io.activeModifiers.has(KeyboardModifier.Ctrl)
    const hasShift = this.io.activeModifiers.has(KeyboardModifier.Shift)

    if (userTriggered && (hasMeta || hasCtrl)) {
      if (this.selectedNotes[uuid]) {
        delete this.selectedNotes[uuid]
      } else if (await this.application.authorizeNoteAccess(note)) {
        runInAction(() => {
          this.selectedNotes[uuid] = note
          this.lastSelectedNote = note
        })
      }
    } else if (userTriggered && hasShift) {
      await this.selectNotesRange(note)
    } else {
      const shouldSelectNote = this.selectedNotesCount > 1 || !this.selectedNotes[uuid]
      if (shouldSelectNote && (await this.application.authorizeNoteAccess(note))) {
        runInAction(() => {
          this.selectedNotes = {
            [note.uuid]: note,
          }
          this.lastSelectedNote = note
        })
      }
    }

    if (this.selectedNotesCount === 1) {
      await this.openNote(Object.keys(this.selectedNotes)[0])
    }
  }

  private async openNote(noteUuid: string): Promise<void> {
    if (this.activeNoteController?.note?.uuid === noteUuid) {
      return
    }

    const note = this.application.items.findItem(noteUuid) as SNNote | undefined
    if (!note) {
      console.warn('Tried accessing a non-existant note of UUID ' + noteUuid)
      return
    }

    if (this.activeNoteController) {
      this.application.noteControllerGroup.closeActiveNoteView()
    }

    await this.application.noteControllerGroup.createNoteView(noteUuid)

    this.appState.noteTags.reloadTags()
    await this.onActiveEditorChanged()
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
    await this.application.mutator.changeItems(Object.values(this.selectedNotes), mutate, false)
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
          this.unselectNotes()
          this.contextMenuOpen = false
        })
      }
    } else {
      await this.changeSelectedNotes((mutator) => {
        mutator.trashed = trashed
      })
      runInAction(() => {
        this.unselectNotes()
        this.contextMenuOpen = false
      })
    }
  }

  async deleteNotesPermanently(): Promise<void> {
    await this.deleteNotes(true)
  }

  async deleteNotes(permanently: boolean): Promise<boolean> {
    if (Object.values(this.selectedNotes).some((note) => note.locked)) {
      const text = StringUtils.deleteLockedNotesAttempt(this.selectedNotesCount)
      this.application.alertService.alert(text).catch(console.error)
      return false
    }

    const title = Strings.trashNotesTitle
    let noteTitle = undefined
    if (this.selectedNotesCount === 1) {
      const selectedNote = Object.values(this.selectedNotes)[0]
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
      if (permanently) {
        for (const note of Object.values(this.selectedNotes)) {
          await this.application.mutator.deleteItem(note)
          delete this.selectedNotes[note.uuid]
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
    if (Object.values(this.selectedNotes).some((note) => note.locked)) {
      this.application.alertService
        .alert(StringUtils.archiveLockedNotesAttempt(archived, this.selectedNotesCount))
        .catch(console.error)
      return
    }

    await this.changeSelectedNotes((mutator) => {
      mutator.archived = archived
    })

    runInAction(() => {
      this.selectedNotes = {}
      this.contextMenuOpen = false
    })
  }

  async setProtectSelectedNotes(protect: boolean): Promise<void> {
    const selectedNotes = Object.values(this.selectedNotes)
    if (protect) {
      await this.application.mutator.protectNotes(selectedNotes)
      this.setShowProtectedWarning(true)
    } else {
      await this.application.mutator.unprotectNotes(selectedNotes)
      this.setShowProtectedWarning(false)
    }
  }

  unselectNotes(): void {
    this.selectedNotes = {}
  }

  getSpellcheckStateForNote(note: SNNote) {
    return note.spellcheck != undefined ? note.spellcheck : this.appState.isGlobalSpellcheckEnabled()
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
    const selectedNotes = Object.values(this.selectedNotes)
    const parentChainTags = this.application.items.getTagParentChain(tag)
    const tagsToAdd = [...parentChainTags, tag]
    await Promise.all(
      tagsToAdd.map(async (tag) => {
        await this.application.mutator.changeItem(tag, (mutator) => {
          for (const note of selectedNotes) {
            mutator.addItemAsRelationship(note)
          }
        })
      }),
    )
    this.application.sync.sync().catch(console.error)
  }

  async removeTagFromSelectedNotes(tag: SNTag): Promise<void> {
    const selectedNotes = Object.values(this.selectedNotes)
    await this.application.mutator.changeItem(tag, (mutator) => {
      for (const note of selectedNotes) {
        mutator.removeItemAsRelationship(note)
      }
    })
    this.application.sync.sync().catch(console.error)
  }

  isTagInSelectedNotes(tag: SNTag): boolean {
    const selectedNotes = Object.values(this.selectedNotes)
    return selectedNotes.every((note) => this.appState.getNoteTags(note).find((noteTag) => noteTag.uuid === tag.uuid))
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

  private get io() {
    return this.application.io
  }

  setShowRevisionHistoryModal(show: boolean): void {
    this.showRevisionHistoryModal = show
  }
}
