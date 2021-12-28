import {
  SNNote,
  ContentType,
  PayloadSource,
  UuidString,
  SNTag,
} from '@standardnotes/snjs';
import { WebApplication } from '@/ui_models/application';

export class NoteViewController {
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
      const note = (await this.application.createTemplateItem(
        ContentType.Note,
        {
          text: '',
          title: this.defaultTitle,
          references: [],
        }
      )) as SNNote;
      if (this.defaultTag) {
        const tag = this.application.findItem(this.defaultTag) as SNTag;
        await this.application.addTagHierarchyToNote(note, tag);
      }
      this.isTemplateNote = true;
      this.note = note;
      this.onNoteValueChange?.(this.note, this.note.payload.source);
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
   * Register to be notified when the controller's note's inner values change
   * (and thus a new object reference is created)
   */
  public setOnNoteInnerValueChange(
    callback: (note: SNNote, source: PayloadSource) => void
  ) {
    this.onNoteValueChange = callback;
    if (this.note) {
      this.onNoteValueChange(this.note, this.note.payload.source);
    }
  }
}
