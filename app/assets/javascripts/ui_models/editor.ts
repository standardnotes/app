import { SNNote, ContentType, PayloadSource } from 'snjs';
import { WebApplication } from './application';

export class Editor {

  public note!: SNNote
  private application: WebApplication
  private _onNoteChange?: () => void
  private _onNoteValueChange?: (note: SNNote, source?: PayloadSource) => void
  private removeStreamObserver: () => void
  public isTemplateNote = false

  constructor(
    application: WebApplication,
    noteUuid?: string,
    noteTitle?: string
  ) {
    this.application = application;
    if (noteUuid) {
      this.note = application.findItem(noteUuid) as SNNote;
    } else {
      this.reset(noteTitle);
    }

    this.removeStreamObserver = this.application.streamItems(
      ContentType.Note,
      async (items, source) => {
        await this.handleNoteStream(items as SNNote[], source);
      }
    );
  }

  deinit() {
    this.removeStreamObserver();
    (this.removeStreamObserver as any) = undefined;
    this._onNoteChange = undefined;
    (this.application as any) = undefined;
    this._onNoteChange = undefined;
    this._onNoteValueChange = undefined;
  }

  private async handleNoteStream(notes: SNNote[], source?: PayloadSource) {
    /** Update our note object reference whenever it changes */
    const matchingNote = notes.find((item) => {
      return item.uuid === this.note.uuid;
    }) as SNNote;
    if (matchingNote) {
      this.isTemplateNote = false;
      this.note = matchingNote;
      this._onNoteValueChange && this._onNoteValueChange!(matchingNote, source);
    }
  }

  async insertTemplatedNote() {
    return this.application.insertItem(this.note);
  }

  /**
   * Reverts the editor to a blank state, removing any existing note from view,
   * and creating a placeholder note.
   */
  async reset(noteTitle?: string) {
    const note = await this.application.createTemplateItem(
      ContentType.Note,
      {
        text: '',
        title: noteTitle || '',
        references: []
      }
    );
    this.isTemplateNote = true;
    this.setNote(note as SNNote);
  }

  /**
   * Register to be notified when the editor's note changes.
   */
  public onNoteChange(callback: () => void) {
    this._onNoteChange = callback;
    if (this.note) {
      callback();
    }
  }

  /**
   * Register to be notified when the editor's note's values change
   * (and thus a new object reference is created)
   */
  public onNoteValueChange(callback: (note: SNNote, source?: PayloadSource) => void) {
    this._onNoteValueChange = callback;
  }

  /**
   * Sets the editor contents by setting its note.
   */
  public setNote(note: SNNote) {
    this.note = note;
    if (this._onNoteChange) {
      this._onNoteChange();
    }
  }
}
