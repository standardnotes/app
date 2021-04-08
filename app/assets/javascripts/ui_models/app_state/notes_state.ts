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
import { WebApplication } from '../application';
import { Editor } from '../editor';

export class NotesState {
  selectedNotes: Record<UuidString, SNNote> = {};

  constructor(
    private application: WebApplication,
    private onActiveEditorChanged: () => Promise<void>,
    appEventListeners: (() => void)[]
  ) {
    makeObservable(this, {
      selectedNotes: observable,

      selectedNotesCount: computed,

      selectNote: action,
      setHideSelectedNotePreviews: action,
      setLockSelectedNotes: action,
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
      this.io.activeModifiers.has(KeyboardModifier.Meta) ||
      this.io.activeModifiers.has(KeyboardModifier.Ctrl)
    ) {
      if (this.selectedNotes[uuid]) {
        delete this.selectedNotes[uuid];
      } else {
        this.selectedNotes[uuid] = note;
      }
    } else {
      this.selectedNotes = {
        [uuid]: note,
      };
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

  async setTrashSelectedNotes(trashed: boolean): Promise<void> {
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
      });
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

  private get io() {
    return this.application.io;
  }
}
