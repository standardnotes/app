import { KeyboardModifier } from "@/services/ioService";
import { UuidString, SNNote } from "@standardnotes/snjs";
import { makeObservable, observable, action } from "mobx";
import { WebApplication } from "../application";
import { Editor } from "../editor";

export class NotesState {
  selectedNotes: Record<UuidString, SNNote> = {};

  constructor(
    private application: WebApplication,
    private onActiveEditorChanged: () => Promise<void>
  ) {
    makeObservable(this, {
      selectedNotes: observable,
      selectNote: action,
    });
  }

  get activeEditor(): Editor | undefined {
    return this.application.editorGroup.editors[0];
  }

  async selectNote(note: SNNote): Promise<void> {
    if (
      this.io.activeModifiers.has(KeyboardModifier.Meta) ||
      this.io.activeModifiers.has(KeyboardModifier.Ctrl)
    ) {
      this.selectedNotes[note.uuid] = note;
    } else {
      this.selectedNotes = {
        [note.uuid]: note,
      };
    }
    await this.openEditor(note.uuid);
  }

  async openEditor(noteUuid: string): Promise<void> {
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

  private get io() {
    return this.application.io;
  }
}
