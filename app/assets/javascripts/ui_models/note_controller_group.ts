import { removeFromArray, UuidString } from '@standardnotes/snjs';
import { NoteController } from './note_controller';
import { WebApplication } from './application';

type NoteControllerGroupChangeCallback = () => void;

export class NoteControllerGroup {
  public noteControllers: NoteController[] = [];
  private application: WebApplication;
  changeObservers: NoteControllerGroupChangeCallback[] = [];

  constructor(application: WebApplication) {
    this.application = application;
  }

  public deinit() {
    (this.application as unknown) = undefined;
    for (const controller of this.noteControllers) {
      this.deleteController(controller);
    }
  }

  async createNoteController(
    noteUuid?: string,
    noteTitle?: string,
    noteTag?: UuidString
  ) {
    const controller = new NoteController(
      this.application,
      noteUuid,
      noteTitle,
      noteTag
    );
    await controller.initialize();
    this.noteControllers.push(controller);
    this.notifyObservers();
  }

  deleteController(controller: NoteController) {
    controller.deinit();
    removeFromArray(this.noteControllers, controller);
  }

  closeController(controller: NoteController) {
    this.deleteController(controller);
    this.notifyObservers();
  }

  closeActiveController() {
    const activeController = this.activeNoteController;
    if (activeController) {
      this.deleteController(activeController);
    }
  }

  closeAllControllers() {
    for (const controller of this.noteControllers) {
      this.deleteController(controller);
    }
  }

  get activeNoteController() {
    return this.noteControllers[0];
  }

  /**
   * Notifies observer when the active controller has changed.
   */
  public addChangeObserver(callback: NoteControllerGroupChangeCallback) {
    this.changeObservers.push(callback);
    if (this.activeNoteController) {
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
