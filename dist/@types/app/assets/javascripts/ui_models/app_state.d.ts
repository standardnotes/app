/// <reference types="angular" />
import { SNTag, SNNote, SNUserPrefs } from 'snjs';
import { WebApplication } from '@/ui_models/application';
import { Editor } from '@/ui_models/editor';
export declare enum AppStateEvent {
    TagChanged = 1,
    ActiveEditorChanged = 2,
    PreferencesChanged = 3,
    PanelResized = 4,
    EditorFocused = 5,
    BeganBackupDownload = 6,
    EndedBackupDownload = 7,
    DesktopExtsReady = 8,
    WindowDidFocus = 9,
    WindowDidBlur = 10
}
export declare enum EventSource {
    UserInteraction = 1,
    Script = 2
}
declare type ObserverCallback = (event: AppStateEvent, data?: any) => Promise<void>;
export declare class AppState {
    $rootScope: ng.IRootScopeService;
    $timeout: ng.ITimeoutService;
    application: WebApplication;
    observers: ObserverCallback[];
    locked: boolean;
    unsubApp: any;
    rootScopeCleanup1: any;
    rootScopeCleanup2: any;
    onVisibilityChange: any;
    selectedTag?: SNTag;
    userPreferences?: SNUserPrefs;
    multiEditorEnabled: boolean;
    constructor($rootScope: ng.IRootScopeService, $timeout: ng.ITimeoutService, application: WebApplication);
    deinit(): void;
    /**
     * Creates a new editor if one doesn't exist. If one does, we'll replace the
     * editor's note with an empty one.
     */
    createEditor(title?: string): Promise<void>;
    openEditor(noteUuid: string): Promise<unknown>;
    getActiveEditor(): Editor;
    getEditors(): Editor[];
    closeEditor(editor: Editor): void;
    closeActiveEditor(): void;
    closeAllEditors(): void;
    editorForNote(note: SNNote): Editor | undefined;
    streamNotesAndTags(): void;
    addAppEventObserver(): void;
    isLocked(): boolean;
    registerVisibilityObservers(): void;
    /** @returns  A function that unregisters this observer */
    addObserver(callback: ObserverCallback): () => void;
    notifyEvent(eventName: AppStateEvent, data?: any): Promise<unknown>;
    setSelectedTag(tag: SNTag): void;
    /** Returns the tags that are referncing this note */
    getNoteTags(note: SNNote): SNTag[];
    /** Returns the notes this tag references */
    getTagNotes(tag: SNTag): SNNote[];
    getSelectedTag(): SNTag | undefined;
    setUserPreferences(preferences: SNUserPrefs): void;
    panelDidResize(name: string, collapsed: boolean): void;
    editorDidFocus(eventSource: EventSource): void;
    beganBackupDownload(): void;
    endedBackupDownload(success: boolean): void;
    /**
     * When the desktop appplication extension server is ready.
     */
    desktopExtensionsReady(): void;
}
export {};
