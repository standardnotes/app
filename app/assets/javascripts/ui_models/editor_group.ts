import { removeFromArray, UuidString } from 'snjs';
import { Editor } from './editor';
import { WebApplication } from './application';

type EditorGroupChangeCallback = () => void

export class EditorGroup {

  public editors: Editor[] = []
  private application: WebApplication
  changeObservers: EditorGroupChangeCallback[] = []

  constructor(application: WebApplication) {
    this.application = application;
  }

  public deinit() {
    (this.application as any) = undefined;
    for (const editor of this.editors) {
      this.deleteEditor(editor);
    }
  }

  createEditor(
    noteUuid?: string,
    noteTitle?: string,
    noteTag?: UuidString
  ) {
    const editor = new Editor(this.application, noteUuid, noteTitle, noteTag);
    this.editors.push(editor);
    this.notifyObservers();
  }

  deleteEditor(editor: Editor) {
    editor.deinit();
    removeFromArray(this.editors, editor);
  }

  closeEditor(editor: Editor) {
    this.deleteEditor(editor);
    this.notifyObservers();
  }

  closeActiveEditor() {
    const activeEditor = this.activeEditor;
    if(activeEditor) {
      this.deleteEditor(activeEditor);
    }
  }

  closeAllEditors() {
    for(const editor of this.editors) {
      this.deleteEditor(editor);
    }
  }

  get activeEditor() {
    return this.editors[0];
  }

  /**
   * Notifies observer when the active editor has changed.
   */
  public addChangeObserver(callback: EditorGroupChangeCallback) {
    this.changeObservers.push(callback);
    if (this.activeEditor) {
      callback();
    }
    return () => {
      removeFromArray(this.changeObservers, callback);
    }
  }

  private notifyObservers() {
    for (const observer of this.changeObservers) {
      observer();
    }
  }
}
