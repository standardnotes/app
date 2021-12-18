import {
  SNNote,
  ContentType,
  PayloadSource,
  UuidString,
  TagMutator,
} from '@standardnotes/snjs';
import { WebApplication } from './application';

export class Editor {
  public note!: SNNote;
  private application: WebApplication;
  private onNoteValueChange?: (note: SNNote, source: PayloadSource) => void;
  private removeStreamObserver?: () => void;
  public isTemplateNote = false;

  constructor(
    application: WebApplication,
    noteUuid: string | undefined,
    private defaultTitle: string | undefined,
    private defaultTag: UuidString | undefined
  ) {
    this.application = application;
    if (noteUuid) {
      this.note = application.findItem(noteUuid) as SNNote;
    }
  }

  async initialize(): Promise<void> {
    if (!this.note) {
      await this.createTemplateNote(this.defaultTitle, this.defaultTag);
    }
    this.streamItems();
  }

  private streamItems() {
    this.removeStreamObserver = this.application.streamItems(
      ContentType.Note,
      (items, source) => {
        this.handleNoteStream(items as SNNote[], source);
      }
    );
  }

  deinit() {
    this.removeStreamObserver?.();
    (this.removeStreamObserver as unknown) = undefined;
    (this.application as unknown) = undefined;
    this.onNoteValueChange = undefined;
  }

  private handleNoteStream(notes: SNNote[], source: PayloadSource) {
    /** Update our note object reference whenever it changes */
    const matchingNote = notes.find((item) => {
      return item.uuid === this.note.uuid;
    }) as SNNote;
    if (matchingNote) {
      this.isTemplateNote = false;
      this.note = matchingNote;
      this.onNoteValueChange?.(matchingNote, source);
    }
  }

  insertTemplatedNote() {
    this.isTemplateNote = false;
    return this.application.insertItem(this.note);
  }

  /**
   * Reverts the editor to a blank state, removing any existing note from view,
   * and creating a placeholder note.
   */
  async createTemplateNote(defaultTitle?: string, noteTag?: UuidString) {
    const note = (await this.application.createTemplateItem(ContentType.Note, {
      text: '',
      title: defaultTitle,
      references: [],
    })) as SNNote;
    if (noteTag) {
      await this.application.changeItem<TagMutator>(noteTag, (m) => {
        m.addItemAsRelationship(note);
      });
    }
    this.isTemplateNote = true;
    this.note = note;
    this.onNoteValueChange?.(this.note, this.note.payload.source);
  }

  /**
   * Register to be notified when the editor's note's values change
   * (and thus a new object reference is created)
   */
  public setOnNoteValueChange(
    callback: (note: SNNote, source: PayloadSource) => void
  ) {
    this.onNoteValueChange = callback;
    if (this.note) {
      this.onNoteValueChange(this.note, this.note.payload.source);
    }
  }
}
