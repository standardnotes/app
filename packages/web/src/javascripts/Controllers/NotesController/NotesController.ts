import { destroyAllObjectProperties } from '@/Utils'
import {
  confirmDialog,
  GetItemTags,
  IsGlobalSpellcheckEnabled,
  PIN_NOTE_COMMAND,
  STAR_NOTE_COMMAND,
} from '@standardnotes/ui-services'
import { StringEmptyTrash, Strings, StringUtils } from '@/Constants/Strings'
import {
  SNNote,
  NoteMutator,
  ContentType,
  SNTag,
  PrefKey,
  ApplicationEvent,
  EditorLineWidth,
  MutationType,
  PrefDefaults,
  InternalEventHandlerInterface,
  InternalEventInterface,
  LocalPrefKey,
  NoteContent,
  noteTypeForEditorIdentifier,
  ContentReference,
  pluralize,
  NoteType,
} from '@standardnotes/snjs'
import { makeObservable, observable, action, computed, runInAction, reaction } from 'mobx'
import { AbstractViewController } from '../Abstract/AbstractViewController'
import { NotesControllerInterface } from './NotesControllerInterface'
import { CrossControllerEvent } from '../CrossControllerEvent'
import { addToast, dismissToast, ToastType } from '@standardnotes/toast'
import { createNoteExport } from '../../Utils/NoteExportUtils'
import { WebApplication } from '../../Application/WebApplication'
import { downloadOrShareBlobBasedOnPlatform } from '../../Utils/DownloadOrShareBasedOnPlatform'

export class NotesController
  extends AbstractViewController
  implements NotesControllerInterface, InternalEventHandlerInterface
{
  shouldLinkToParentFolders: boolean
  lastSelectedNote: SNNote | undefined
  contextMenuOpen = false
  contextMenuClickLocation: { x: number; y: number } = { x: 0, y: 0 }
  contextMenuMaxHeight: number | 'auto' = 'auto'
  showProtectedWarning = false
  shouldShowSuperExportModal = false

  commandRegisterDisposers: (() => void)[] = []

  constructor(
    private application: WebApplication,
    private _isGlobalSpellcheckEnabled: IsGlobalSpellcheckEnabled,
    private _getItemTags: GetItemTags,
  ) {
    super(application.events)

    makeObservable(this, {
      contextMenuOpen: observable,
      showProtectedWarning: observable,
      shouldShowSuperExportModal: observable,

      selectedNotes: computed,
      firstSelectedNote: computed,
      selectedNotesCount: computed,
      trashedNotesCount: computed,

      setContextMenuOpen: action,
      setContextMenuClickLocation: action,
      setShowProtectedWarning: action,
      unselectNotes: action,
      showSuperExportModal: action,
      closeSuperExportModal: action,
    })

    this.shouldLinkToParentFolders = application.preferences.getValue(
      PrefKey.NoteAddToParentFolders,
      PrefDefaults[PrefKey.NoteAddToParentFolders],
    )

    application.events.addEventHandler(this, ApplicationEvent.PreferencesChanged)
    application.events.addEventHandler(this, CrossControllerEvent.UnselectAllNotes)

    this.disposers.push(
      reaction(
        () => this.selectedNotesCount,
        (notes_count) => {
          console.log('hello')
          this.disposeCommandRegisters()

          const descriptionSuffix = `${pluralize(notes_count, 'current', 'selected')} ${pluralize(
            notes_count,
            'note',
            'note(s)',
          )}`

          this.commandRegisterDisposers.push(
            application.commands.add(
              'pin-current',
              `Pin ${descriptionSuffix}`,
              () => this.setPinSelectedNotes(true),
              'unpin',
            ),
            application.commands.add(
              'unpin-current',
              `Unpin ${descriptionSuffix}`,
              () => this.setPinSelectedNotes(false),
              'pin',
            ),
            application.commands.add(
              'star-current',
              `Star ${descriptionSuffix}`,
              () => this.setStarSelectedNotes(true),
              'star',
            ),
            application.commands.add(
              'unstar-current',
              `Unstar ${descriptionSuffix}`,
              () => this.setStarSelectedNotes(false),
              'star',
            ),
            application.commands.add(
              'archive-current',
              `Archive ${descriptionSuffix}`,
              () => this.setArchiveSelectedNotes(true),
              'archive',
            ),
            application.commands.add(
              'unarchive-current',
              `Unarchive ${descriptionSuffix}`,
              () => this.setArchiveSelectedNotes(false),
              'unarchive',
            ),
            application.commands.add(
              'restore-current',
              `Restore ${descriptionSuffix}`,
              () => this.setTrashSelectedNotes(false),
              'restore',
            ),
            application.commands.add(
              'trash-current',
              `Trash ${descriptionSuffix}`,
              () => this.setTrashSelectedNotes(true),
              'trash',
            ),
            application.commands.add(
              'delete-current',
              `Delete ${descriptionSuffix} permanently`,
              () => this.deleteNotesPermanently(),
              'trash',
            ),
            application.commands.add(
              'export-current',
              `Export ${descriptionSuffix}`,
              this.exportSelectedNotes,
              'download',
            ),
            application.commands.add(
              'duplicate-current',
              `Duplicate ${descriptionSuffix}`,
              this.duplicateSelectedNotes,
              'copy',
            ),
          )
        },
      ),
    )

    this.disposers.push(
      application.keyboardService.addCommandHandler({
        command: PIN_NOTE_COMMAND,
        category: 'Current note',
        description: 'Pin/unpin selected note(s)',
        onKeyDown: this.togglePinSelectedNotes,
      }),
      application.keyboardService.addCommandHandler({
        command: STAR_NOTE_COMMAND,
        category: 'Current note',
        description: 'Star/unstar selected note(s)',
        onKeyDown: this.toggleStarSelectedNotes,
      }),
    )

    this.disposers.push(
      application.itemControllerGroup.addActiveControllerChangeObserver(() => {
        const controllers = application.itemControllerGroup.itemControllers

        const activeNoteUuids = controllers.map((controller) => controller.item.uuid)

        const selectedUuids = this.getSelectedNotesList().map((n) => n.uuid)

        for (const selectedId of selectedUuids) {
          if (!activeNoteUuids.includes(selectedId)) {
            application.itemListController.deselectItem({ uuid: selectedId })
          }
        }
      }),
    )
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === ApplicationEvent.PreferencesChanged) {
      this.shouldLinkToParentFolders = this.application.preferences.getValue(
        PrefKey.NoteAddToParentFolders,
        PrefDefaults[PrefKey.NoteAddToParentFolders],
      )
    } else if (event.type === CrossControllerEvent.UnselectAllNotes) {
      this.unselectNotes()
    }
  }

  private disposeCommandRegisters() {
    if (this.commandRegisterDisposers.length > 0) {
      for (const dispose of this.commandRegisterDisposers) {
        dispose()
      }
    }
  }

  override deinit() {
    super.deinit()
    ;(this.lastSelectedNote as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  public get selectedNotes(): SNNote[] {
    return this.application.itemListController.getFilteredSelectedItems<SNNote>(ContentType.TYPES.Note)
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

  async changeSelectedNotes(mutate: (mutator: NoteMutator) => void): Promise<void> {
    await this.application.mutator.changeItems(this.getSelectedNotesList(), mutate, MutationType.NoUpdateUserTimestamps)
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
      this.application.alerts.alert(text).catch(console.error)
      return false
    }

    const title = permanently ? Strings.deleteItemsPermanentlyTitle : Strings.trashItemsTitle
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
      this.application.itemListController.selectNextItem()
      if (permanently) {
        await this.application.mutator.deleteItems(this.getSelectedNotesList())
        void this.application.sync.sync()
      } else {
        await this.changeSelectedNotes((mutator) => {
          mutator.trashed = true
        })
      }
      return true
    }

    return false
  }

  togglePinSelectedNotes = () => {
    const notes = this.selectedNotes
    const pinned = notes.some((note) => note.pinned)

    if (!pinned) {
      this.setPinSelectedNotes(true)
    } else {
      this.setPinSelectedNotes(false)
    }
  }

  toggleStarSelectedNotes = () => {
    const notes = this.selectedNotes
    const starred = notes.some((note) => note.starred)

    if (!starred) {
      this.setStarSelectedNotes(true)
    } else {
      this.setStarSelectedNotes(false)
    }
  }

  setPinSelectedNotes(pinned: boolean): void {
    this.changeSelectedNotes((mutator) => {
      mutator.pinned = pinned
    }).catch(console.error)
  }

  setStarSelectedNotes(starred: boolean): void {
    this.changeSelectedNotes((mutator) => {
      mutator.starred = starred
    }).catch(console.error)
  }

  async setArchiveSelectedNotes(archived: boolean): Promise<void> {
    if (this.getSelectedNotesList().some((note) => note.locked)) {
      this.application.alerts
        .alert(StringUtils.archiveLockedNotesAttempt(archived, this.selectedNotesCount))
        .catch(console.error)
      return
    }

    await this.changeSelectedNotes((mutator) => {
      mutator.archived = archived
    })

    runInAction(() => {
      this.application.itemListController.deselectAll()
      this.contextMenuOpen = false
    })
  }

  async toggleArchiveSelectedNotes(): Promise<void> {
    const notes = this.selectedNotes
    const archived = notes.some((note) => note.archived)

    if (!archived) {
      await this.setArchiveSelectedNotes(true)
    } else {
      await this.setArchiveSelectedNotes(false)
    }
  }

  async setProtectSelectedNotes(protect: boolean): Promise<void> {
    const selectedNotes = this.getSelectedNotesList()
    if (protect) {
      await this.application.protections.protectNotes(selectedNotes)
      this.setShowProtectedWarning(true)
    } else {
      await this.application.protections.unprotectNotes(selectedNotes)
      this.setShowProtectedWarning(false)
    }

    void this.application.sync.sync()
  }

  unselectNotes(): void {
    this.application.itemListController.deselectAll()
  }

  getSpellcheckStateForNote(note: SNNote) {
    return note.spellcheck != undefined ? note.spellcheck : this._isGlobalSpellcheckEnabled.execute().getValue()
  }

  async toggleGlobalSpellcheckForNote(note: SNNote) {
    await this.application.mutator.changeItem<NoteMutator>(
      note,
      (mutator) => {
        mutator.toggleSpellcheck()
      },
      MutationType.NoUpdateUserTimestamps,
    )
    this.application.sync.sync().catch(console.error)
  }

  getEditorWidthForNote(note: SNNote) {
    return (
      note.editorWidth ??
      this.application.preferences.getLocalValue(
        LocalPrefKey.EditorLineWidth,
        PrefDefaults[LocalPrefKey.EditorLineWidth],
      )
    )
  }

  async setNoteEditorWidth(note: SNNote, editorWidth: EditorLineWidth) {
    await this.application.mutator.changeItem<NoteMutator>(
      note,
      (mutator) => {
        mutator.editorWidth = editorWidth
      },
      MutationType.NoUpdateUserTimestamps,
    )
    this.application.sync.sync().catch(console.error)
  }

  async addTagToSelectedNotes(tag: SNTag): Promise<void> {
    const selectedNotes = this.getSelectedNotesList()
    await Promise.all(
      selectedNotes.map(async (note) => {
        await this.application.mutator.addTagToNote(note, tag, this.shouldLinkToParentFolders)
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
      this._getItemTags
        .execute(note)
        .getValue()
        .find((noteTag) => noteTag.uuid === tag.uuid),
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
      await this.application.mutator.emptyTrash()
      this.application.sync.sync().catch(console.error)
    }
  }

  private getSelectedNotesList(): SNNote[] {
    return Object.values(this.selectedNotes)
  }

  async createNoteWithContent(
    editorIdentifier: string,
    title: string,
    text: string,
    references: ContentReference[] = [],
  ): Promise<SNNote> {
    const noteType = noteTypeForEditorIdentifier(editorIdentifier)
    const selectedTag = this.application.navigationController.selected
    const templateNote = this.application.items.createTemplateItem<NoteContent, SNNote>(ContentType.TYPES.Note, {
      title,
      text,
      references,
      noteType,
      editorIdentifier,
    })
    const note = await this.application.mutator.insertItem<SNNote>(templateNote)
    if (selectedTag instanceof SNTag) {
      const shouldAddTagHierarchy = this.application.preferences.getValue(PrefKey.NoteAddToParentFolders, true)
      await this.application.mutator.addTagToNote(templateNote, selectedTag, shouldAddTagHierarchy)
    }
    return note
  }

  showSuperExportModal = () => {
    this.shouldShowSuperExportModal = true
  }
  closeSuperExportModal = () => {
    this.shouldShowSuperExportModal = false
  }

  // gets attribute info about the given notes in a single loop
  getNotesInfo = (notes: SNNote[]) => {
    let pinned = false,
      unpinned = false,
      starred = false,
      unstarred = false,
      trashed = false,
      notTrashed = false,
      archived = false,
      unarchived = false,
      hiddenPreviews = 0,
      unhiddenPreviews = 0,
      locked = 0,
      unlocked = 0,
      protecteds = 0,
      unprotected = 0

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i]
      if (!note) {
        continue
      }
      if (note.pinned) {
        pinned = true
      } else {
        unpinned = true
      }
      if (note.starred) {
        starred = true
      } else {
        unstarred = true
      }
      if (note.trashed) {
        trashed = true
      } else {
        notTrashed = true
      }
      if (note.archived) {
        archived = true
      } else {
        unarchived = true
      }
      if (note.hidePreview) {
        hiddenPreviews++
      } else {
        unhiddenPreviews++
      }
      if (note.locked) {
        locked++
      } else {
        unlocked++
      }
      if (note.protected) {
        protecteds++
      } else {
        unprotected++
      }
    }

    return {
      pinned,
      unpinned,
      starred,
      unstarred,
      trashed,
      notTrashed,
      archived,
      unarchived,
      hidePreviews: hiddenPreviews > unhiddenPreviews,
      locked: locked > unlocked,
      protect: protecteds > unprotected,
    }
  }

  downloadSelectedNotes = async () => {
    const notes = this.selectedNotes
    if (notes.length === 0) {
      return
    }
    const toast = addToast({
      type: ToastType.Progress,
      message: `Exporting ${notes.length} ${pluralize(notes.length, 'note', 'notes')}...`,
    })
    try {
      const result = await createNoteExport(this.application, notes)
      if (!result) {
        return
      }
      const { blob, fileName } = result
      void downloadOrShareBlobBasedOnPlatform({
        archiveService: this.application.archiveService,
        platform: this.application.platform,
        mobileDevice: this.application.mobileDevice,
        blob: blob,
        filename: fileName,
        isNativeMobileWeb: this.application.isNativeMobileWeb(),
      })
      dismissToast(toast)
    } catch (error) {
      console.error(error)
      addToast({
        type: ToastType.Error,
        message: 'Could not export notes',
      })
      dismissToast(toast)
    }
  }

  exportSelectedNotes = () => {
    const notes = this.selectedNotes
    const hasSuperNote = notes.some((note) => note.noteType === NoteType.Super)

    if (hasSuperNote) {
      this.showSuperExportModal()
      return
    }

    this.downloadSelectedNotes().catch(console.error)
  }

  duplicateSelectedNotes = async () => {
    const notes = this.selectedNotes
    await Promise.all(
      notes.map((note) =>
        this.application.mutator
          .duplicateItem(note)
          .then((duplicated) =>
            addToast({
              type: ToastType.Regular,
              message: `Duplicated note "${duplicated.title}"`,
              actions: [
                {
                  label: 'Open',
                  handler: (toastId) => {
                    this.application.itemListController.selectUuids([duplicated.uuid], true).catch(console.error)
                    dismissToast(toastId)
                  },
                },
              ],
              autoClose: true,
            }),
          )
          .catch(console.error),
      ),
    )
    void this.application.sync.sync()
  }
}
