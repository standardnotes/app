import { confirmDialog } from '@/services/alertService';
import { KeyboardModifier } from '@/services/ioService';
import { Strings } from '@/strings';
import {
  UuidString,
  SNNote,
  NoteMutator,
  ContentType,
} from '@standardnotes/snjs';
import {
  makeObservable,
  observable,
  action,
  computed,
  runInAction,
} from 'mobx';
import { RefObject } from 'preact';
import { WebApplication } from '../application';
import { Editor } from '../editor';

export class NotesState {
  lastSelectedNote: SNNote | undefined;
  selectedNotes: Record<UuidString, SNNote> = {};
  contextMenuOpen = false;
  contextMenuPosition: { top: number; left: number } = { top: 0, left: 0 };

  constructor(
    private application: WebApplication,
    private onActiveEditorChanged: () => Promise<void>,
    appEventListeners: (() => void)[]
  ) {
    makeObservable(this, {
      selectedNotes: observable,
      contextMenuOpen: observable,
      contextMenuPosition: observable,

      selectedNotesCount: computed,

      selectNote: action,
      setArchiveSelectedNotes: action,
      setContextMenuOpen: action,
      setContextMenuPosition: action,
      setHideSelectedNotePreviews: action,
      setLockSelectedNotes: action,
      setPinSelectedNotes: action,
      setTrashSelectedNotes: action,
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
  }

  get activeEditor(): Editor | undefined {
    return this.application.editorGroup.editors[0];
  }

  get selectedNotesCount(): number {
    return Object.keys(this.selectedNotes).length;
  }

  async selectNote(uuid: UuidString): Promise<void> {
    const note = this.application.findItem(uuid) as SNNote;
    if (
      this.io.activeModifiers.has(
        KeyboardModifier.Meta || KeyboardModifier.Ctrl
      )
    ) {
      if (this.selectedNotes[uuid]) {
        delete this.selectedNotes[uuid];
      } else {
        this.selectedNotes[uuid] = note;
        this.lastSelectedNote = note;
      }
    } else if (this.io.activeModifiers.has(KeyboardModifier.Shift)) {
      const notes = this.application.getDisplayableItems(
        ContentType.Note
      ) as SNNote[];
      const lastSelectedNoteIndex = notes.findIndex(
        (note) => note.uuid == this.lastSelectedNote?.uuid
      );
      const selectedNoteIndex = notes.findIndex((note) => note.uuid == uuid);
      notes
        .slice(lastSelectedNoteIndex, selectedNoteIndex + 1)
        .forEach((note) => (this.selectedNotes[note.uuid] = note));
    } else {
      this.selectedNotes = {
        [uuid]: note,
      };
      this.lastSelectedNote = note;
      await this.openEditor(uuid);
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

    if (await this.application.authorizeNoteAccess(note)) {
      if (!this.activeEditor) {
        this.application.editorGroup.createEditor(noteUuid);
      } else {
        this.activeEditor.setNote(note);
      }
      await this.onActiveEditorChanged();

      if (note.waitingForKey) {
        this.application.presentKeyRecoveryWizard();
      }
    }
  }

  setContextMenuOpen(open: boolean): void {
    this.contextMenuOpen = open;
  }

  setContextMenuPosition(position: { top: number; left: number }): void {
    this.contextMenuPosition = position;
  }

  setHideSelectedNotePreviews(hide: boolean): void {
    this.application.changeItems<NoteMutator>(
      Object.keys(this.selectedNotes),
      (mutator) => {
        mutator.hidePreview = hide;
      },
      false
    );
  }

  setLockSelectedNotes(lock: boolean): void {
    this.application.changeItems<NoteMutator>(
      Object.keys(this.selectedNotes),
      (mutator) => {
        mutator.locked = lock;
      },
      false
    );
  }

  async setTrashSelectedNotes(
    trashed: boolean,
    trashButtonRef: RefObject<HTMLButtonElement>
  ): Promise<void> {
    if (
      await confirmDialog({
        title: Strings.trashNotesTitle,
        text: Strings.trashNotesText,
        confirmButtonStyle: 'danger',
      })
    ) {
      this.application.changeItems<NoteMutator>(
        Object.keys(this.selectedNotes),
        (mutator) => {
          mutator.trashed = trashed;
        },
        false
      );
      runInAction(() => {
        this.selectedNotes = {};
        this.contextMenuOpen = false;
      });
    } else {
      trashButtonRef.current?.focus();
    }
  }

  setPinSelectedNotes(pinned: boolean): void {
    this.application.changeItems<NoteMutator>(
      Object.keys(this.selectedNotes),
      (mutator) => {
        mutator.pinned = pinned;
      },
      false
    );
  }

  setArchiveSelectedNotes(archived: boolean): void {
    this.application.changeItems<NoteMutator>(
      Object.keys(this.selectedNotes),
      (mutator) => {
        mutator.archived = archived;
      }
    );
    runInAction(() => {
      this.selectedNotes = {};
    });
  }

  unselectNotes(): void {
    this.selectedNotes = {};
  }

  private get io() {
    return this.application.io;
  }
}
