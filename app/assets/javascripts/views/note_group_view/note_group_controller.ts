import { removeFromArray, UuidString } from '@standardnotes/snjs';
import { NoteViewController } from '@/views/note_view/note_view_controller';
import { WebApplication } from '@/ui_models/application';

type NoteControllerGroupChangeCallback = () => void;

export class NoteGroupController {
  public noteControllers: NoteViewController[] = [];
  private application: WebApplication;
  changeObservers: NoteControllerGroupChangeCallback[] = [];

  constructor(application: WebApplication) {
    this.application = application;
  }

  public deinit() {
    (this.application as unknown) = undefined;
    for (const controller of this.noteControllers) {
      this.deleteNoteView(controller);
    }
  }

  async createNoteView(
    noteUuid?: string,
    noteTitle?: string,
    noteTag?: UuidString
  ) {
    const controller = new NoteViewController(
      this.application,
      noteUuid,
      noteTitle,
      noteTag
    );
    await controller.initialize();
    this.noteControllers.push(controller);
    this.notifyObservers();
  }

  deleteNoteView(controller: NoteViewController) {
    controller.deinit();
    removeFromArray(this.noteControllers, controller);
  }

  closeNoteView(controller: NoteViewController) {
    this.deleteNoteView(controller);
    this.notifyObservers();
  }

  closeActiveNoteView() {
    const activeController = this.activeNoteViewController;
    if (activeController) {
      this.deleteNoteView(activeController);
    }
  }

  closeAllNoteViews() {
    for (const controller of this.noteControllers) {
      this.deleteNoteView(controller);
    }
  }

  get activeNoteViewController() {
    return this.noteControllers[0];
  }

  /**
   * Notifies observer when the active controller has changed.
   */
  public addChangeObserver(callback: NoteControllerGroupChangeCallback) {
    this.changeObservers.push(callback);
    if (this.activeNoteViewController) {
      callback();
    }
    return () => {
      removeFromArray(this.changeObservers, callback);
    };
  }

  private notifyObservers() {
    for (const observer of this.changeObservers) {
      observer();
    }
  }
}
