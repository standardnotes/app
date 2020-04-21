import { Editor } from './editor';
import { WebApplication } from './application';
declare type EditorGroupChangeCallback = () => void;
export declare class EditorGroup {
    editors: Editor[];
    private application;
    changeObservers: EditorGroupChangeCallback[];
    constructor(application: WebApplication);
    deinit(): void;
    createEditor(noteUuid?: string, noteTitle?: string): void;
    deleteEditor(editor: Editor): void;
    closeEditor(editor: Editor): void;
    closeActiveEditor(): void;
    closeAllEditors(): void;
    get activeEditor(): Editor;
    /**
     * Notifies observer when the active editor has changed.
     */
    addChangeObserver(callback: EditorGroupChangeCallback): () => void;
    private notifyObservers;
}
export {};
