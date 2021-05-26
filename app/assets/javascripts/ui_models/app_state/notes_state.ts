import { confirmDialog } from '@/services/alertService';
import { KeyboardModifier } from '@/services/ioService';
import { StringEmptyTrash, Strings, StringUtils } from '@/strings';
import {
  UuidString,
  SNNote,
  NoteMutator,
  ContentType,
  SNTag,
  ChallengeReason,
} from '@standardnotes/snjs';
import {
  makeObservable,
  observable,
  action,
  computed,
  runInAction,
} from 'mobx';
import { WebApplication } from '../application';
import { Editor } from '../editor';

export class NotesState {
  lastSelectedNote: SNNote | undefined;
  selectedNotes: Record<UuidString, SNNote> = {};
  contextMenuOpen = false;
  contextMenuPosition: { top?: number; left: number; bottom?: number } = {
    top: 0,
    left: 0,
  };
  contextMenuMaxHeight: number | 'auto' = 'auto';
  showProtectedWarning = false;
  activeNoteTags: SNTag[] = [];

  constructor(
    private application: WebApplication,
    private onActiveEditorChanged: () => Promise<void>,
    appEventListeners: (() => void)[]
  ) {
    makeObservable(this, {
      selectedNotes: observable,
      contextMenuOpen: observable,
      contextMenuPosition: observable,
      showProtectedWarning: observable,
      activeNoteTags: observable,

      selectedNotesCount: computed,
      trashedNotesCount: computed,

      reloadActiveNoteTags: action,
      setContextMenuOpen: action,
      setContextMenuPosition: action,
      setContextMenuMaxHeight: action,
      setShowProtectedWarning: action,
      unselectNotes: action,
    });

    appEventListeners.push(
      application.streamItems(ContentType.Note, (notes) => {
        runInAction(() => {
          for (const note of notes) {
            if (this.selectedNotes[note.uuid]) {
              this.selectedNotes[note.uuid] = note as SNNote;
            }
          }
        });
      })
    );
    appEventListeners.push(
      application.streamItems(
        ContentType.Tag,
        () => {
          this.reloadActiveNoteTags();
        }
      )
    );
  }

  get activeEditor(): Editor | undefined {
    return this.application.editorGroup.editors[0];
  }

  get activeNote(): SNNote | undefined {
    return this.activeEditor?.note;
  }

  get selectedNotesCount(): number {
    return Object.keys(this.selectedNotes).length;
  }

  get trashedNotesCount(): number {
    return this.application.getTrashedItems().length;
  }

  private async selectNotesRange(selectedNote: SNNote): Promise<void> {
    const notes = this.application.getDisplayableItems(
      ContentType.Note
    ) as SNNote[];
    const lastSelectedNoteIndex = notes.findIndex(
      (note) => note.uuid == this.lastSelectedNote?.uuid
    );
    const selectedNoteIndex = notes.findIndex(
      (note) => note.uuid == selectedNote.uuid
    );

    let notesToSelect = [];
    if (selectedNoteIndex > lastSelectedNoteIndex) {
      notesToSelect = notes.slice(lastSelectedNoteIndex, selectedNoteIndex + 1);
    } else {
      notesToSelect = notes.slice(selectedNoteIndex, lastSelectedNoteIndex + 1);
    }

    const authorizedNotes =
      await this.application.authorizeProtectedActionForNotes(
        notesToSelect,
        ChallengeReason.SelectProtectedNote
      );

    for (const note of authorizedNotes) {
      runInAction(() => {
        this.selectedNotes[note.uuid] = note;
        this.lastSelectedNote = note;
      });
    }
  }

  async selectNote(uuid: UuidString): Promise<void> {
    const note = this.application.findItem(uuid) as SNNote;

    if (note) {
      if (
        this.io.activeModifiers.has(KeyboardModifier.Meta) ||
        this.io.activeModifiers.has(KeyboardModifier.Ctrl)
      ) {
        if (this.selectedNotes[uuid]) {
          delete this.selectedNotes[uuid];
        } else if (await this.application.authorizeNoteAccess(note)) {
          runInAction(() => {
            this.selectedNotes[uuid] = note;
            this.lastSelectedNote = note;
          });
        }
      } else if (this.io.activeModifiers.has(KeyboardModifier.Shift)) {
        await this.selectNotesRange(note);
      } else {
        const shouldSelectNote =
          this.selectedNotesCount > 1 || !this.selectedNotes[uuid];
        if (
          shouldSelectNote &&
          (await this.application.authorizeNoteAccess(note))
        ) {
          runInAction(() => {
            this.selectedNotes = {
              [note.uuid]: note,
            };
            this.lastSelectedNote = note;
          });
        }
      }

      if (this.selectedNotesCount === 1) {
        await this.openEditor(Object.keys(this.selectedNotes)[0]);
      }
    }
  }

  reloadActiveNoteTags(): void {
    const { activeNote } = this;
    if (activeNote) {
      this.activeNoteTags = this.application.getSortedTagsForNote(activeNote);
    } 
  }

  private async openEditor(noteUuid: string): Promise<void> {
    if (this.activeEditor?.note?.uuid === noteUuid) {
      return;
    }

    const note = this.application.findItem(noteUuid) as SNNote | undefined;
    if (!note) {
      console.warn('Tried accessing a non-existant note of UUID ' + noteUuid);
      return;
    }

    if (!this.activeEditor) {
      this.application.editorGroup.createEditor(noteUuid);
    } else {
      this.activeEditor.setNote(note);
    }
    
    this.reloadActiveNoteTags();
    await this.onActiveEditorChanged();

    if (note.waitingForKey) {
      this.application.presentKeyRecoveryWizard();
    }
  }

  setContextMenuOpen(open: boolean): void {
    this.contextMenuOpen = open;
  }

  setContextMenuPosition(position: {
    top?: number;
    left: number;
    bottom?: number;
  }): void {
    this.contextMenuPosition = position;
  }

  setContextMenuMaxHeight(maxHeight: number | 'auto'): void {
    this.contextMenuMaxHeight = maxHeight;
  }

  async changeSelectedNotes(
    mutate: (mutator: NoteMutator) => void
  ): Promise<void> {
    await this.application.changeItems(
      Object.keys(this.selectedNotes),
      mutate,
      false
    );
    this.application.sync();
  }

  setHideSelectedNotePreviews(hide: boolean): void {
    this.changeSelectedNotes((mutator) => {
      mutator.hidePreview = hide;
    });
  }

  setLockSelectedNotes(lock: boolean): void {
    this.changeSelectedNotes((mutator) => {
      mutator.locked = lock;
    });
  }

  async setTrashSelectedNotes(trashed: boolean): Promise<void> {
    if (trashed) {
      const notesDeleted = await this.deleteNotes(false);
      if (notesDeleted) {
        runInAction(() => {
          this.unselectNotes();
          this.contextMenuOpen = false;
        });
      }
    } else {
      await this.changeSelectedNotes((mutator) => {
        mutator.trashed = trashed;
      });
      runInAction(() => {
        this.unselectNotes();
        this.contextMenuOpen = false;
      });
    }
  }

  async deleteNotesPermanently(): Promise<void> {
    await this.deleteNotes(true);
  }

  async deleteNotes(permanently: boolean): Promise<boolean> {
    if (Object.values(this.selectedNotes).some((note) => note.locked)) {
      const text = StringUtils.deleteLockedNotesAttempt(
        this.selectedNotesCount
      );
      this.application.alertService.alert(text);
      return false;
    }

    const title = Strings.trashNotesTitle;
    let noteTitle = undefined;
    if (this.selectedNotesCount === 1) {
      const selectedNote = Object.values(this.selectedNotes)[0];
      noteTitle = selectedNote.safeTitle().length
        ? `'${selectedNote.title}'`
        : 'this note';
    }
    const text = StringUtils.deleteNotes(
      permanently,
      this.selectedNotesCount,
      noteTitle
    );

    if (
      await confirmDialog({
        title,
        text,
        confirmButtonStyle: 'danger',
      })
    ) {
      if (permanently) {
        for (const note of Object.values(this.selectedNotes)) {
          await this.application.deleteItem(note);
        }
      } else {
        await this.changeSelectedNotes((mutator) => {
          mutator.trashed = true;
        });
      }
      return true;
    }

    return false;
  }

  setPinSelectedNotes(pinned: boolean): void {
    this.changeSelectedNotes((mutator) => {
      mutator.pinned = pinned;
    });
  }

  async setArchiveSelectedNotes(archived: boolean): Promise<void> {
    if (Object.values(this.selectedNotes).some((note) => note.locked)) {
      this.application.alertService.alert(
        StringUtils.archiveLockedNotesAttempt(archived, this.selectedNotesCount)
      );
      return;
    }

    await this.changeSelectedNotes((mutator) => {
      mutator.archived = archived;
    });

    runInAction(() => {
      this.selectedNotes = {};
      this.contextMenuOpen = false;
    });
  }

  async setProtectSelectedNotes(protect: boolean): Promise<void> {
    const selectedNotes = Object.values(this.selectedNotes);
    if (protect) {
      await this.application.protectNotes(selectedNotes);
      if (!this.application.hasProtectionSources()) {
        this.setShowProtectedWarning(true);
      }
    } else {
      await this.application.unprotectNotes(selectedNotes);
      this.setShowProtectedWarning(false);
    }
  }

  unselectNotes(): void {
    this.selectedNotes = {};
  }

  async addTagToSelectedNotes(tag: SNTag): Promise<void> {
    const selectedNotes = Object.values(this.selectedNotes);
    await this.application.changeItem(tag.uuid, (mutator) => {
      for (const note of selectedNotes) {
        mutator.addItemAsRelationship(note);
      }
    });
    this.application.sync();
  }

  async removeTagFromSelectedNotes(tag: SNTag): Promise<void> {
    const selectedNotes = Object.values(this.selectedNotes);
    await this.application.changeItem(tag.uuid, (mutator) => {
      for (const note of selectedNotes) {
        mutator.removeItemAsRelationship(note);
      }
    });
    this.application.sync();

  }

  isTagInSelectedNotes(tag: SNTag): boolean {
    const selectedNotes = Object.values(this.selectedNotes);
    return selectedNotes.every((note) =>
      this.application
        .getAppState()
        .getNoteTags(note)
        .find((noteTag) => noteTag.uuid === tag.uuid)
    );
  }

  async addTagToActiveNote(tag: SNTag): Promise<void> {
    const { activeNote } = this;
    if (activeNote) {
      await this.application.changeItem(tag.uuid, (mutator) => {
        mutator.addItemAsRelationship(activeNote);
      });
      this.application.sync();
      this.reloadActiveNoteTags();
    }
  }

  async removeTagFromActiveNote(tag: SNTag): Promise<void> {
    const { activeNote } = this;
    if (activeNote) {
      await this.application.changeItem(tag.uuid, (mutator) => {
        mutator.removeItemAsRelationship(activeNote);
      });
      this.application.sync();
      this.reloadActiveNoteTags();
    }
  }


  setShowProtectedWarning(show: boolean): void {
    this.showProtectedWarning = show;
  }

  async emptyTrash(): Promise<void> {
    if (
      await confirmDialog({
        text: StringEmptyTrash(this.trashedNotesCount),
        confirmButtonStyle: 'danger',
      })
    ) {
      this.application.emptyTrash();
      this.application.sync();
    }
  }

  private get io() {
    return this.application.io;
  }
}
