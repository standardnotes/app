import { SNNote, PayloadSource } from 'snjs';
import { WebApplication } from './application';
export declare class Editor {
    note: SNNote;
    private application;
    private _onNoteChange?;
    private _onNoteValueChange?;
    private removeStreamObserver?;
    isTemplateNote: boolean;
    constructor(application: WebApplication, noteUuid?: string, noteTitle?: string);
    private streamItems;
    deinit(): void;
    private handleNoteStream;
    insertTemplatedNote(): Promise<import("snjs/dist/@types/models/core/item").SNItem>;
    /**
     * Reverts the editor to a blank state, removing any existing note from view,
     * and creating a placeholder note.
     */
    reset(noteTitle?: string): Promise<void>;
    /**
     * Register to be notified when the editor's note changes.
     */
    onNoteChange(callback: () => void): void;
    clearNoteChangeListener(): void;
    /**
     * Register to be notified when the editor's note's values change
     * (and thus a new object reference is created)
     */
    onNoteValueChange(callback: (note: SNNote, source?: PayloadSource) => void): void;
    /**
     * Sets the editor contents by setting its note.
     */
    setNote(note: SNNote, isTemplate?: boolean): void;
}
