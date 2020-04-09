export namespace AppStateEvents {
    export const TagChanged: number;
    export const NoteChanged: number;
    export const PreferencesChanged: number;
    export const PanelResized: number;
    export const EditorFocused: number;
    export const BeganBackupDownload: number;
    export const EndedBackupDownload: number;
    export const DesktopExtsReady: number;
    export const WindowDidFocus: number;
    export const WindowDidBlur: number;
}
export namespace EventSources {
    export const UserInteraction: number;
    export const Script: number;
}
export class AppState {
    constructor($rootScope: any, $timeout: any, application: any);
    $timeout: any;
    $rootScope: any;
    application: any;
    observers: any[];
    locked: boolean;
    deinit(): void;
    unsubApp: any;
    rootScopeCleanup1: any;
    rootScopeCleanup2: any;
    onVisibilityChange(): void;
    addAppEventObserver(): void;
    isLocked(): boolean;
    registerVisibilityObservers(): void;
    /** @returns  A function that unregisters this observer */
    addObserver(callback: any): () => void;
    notifyEvent(eventName: any, data: any): Promise<any>;
    setSelectedTag(tag: any): void;
    selectedTag: any;
    setSelectedNote(note: any): Promise<any>;
    selectedNote: any;
    getSelectedTag(): any;
    getSelectedNote(): any;
    setUserPreferences(preferences: any): void;
    userPreferences: any;
    panelDidResize({ name, collapsed }: {
        name: any;
        collapsed: any;
    }): void;
    editorDidFocus(eventSource: any): void;
    beganBackupDownload(): void;
    endedBackupDownload({ success }: {
        success: any;
    }): void;
    /**
     * When the desktop appplication extension server is ready.
     */
    desktopExtensionsReady(): void;
}
