/// <reference types="pug" />
export class EditorPanel {
    restrict: string;
    scope: {};
    template: import("pug").compileTemplate;
    replace: boolean;
    controller: typeof EditorCtrl;
    controllerAs: string;
    bindToController: boolean;
}
declare class EditorCtrl {
    constructor($timeout: any, $rootScope: any, alertManager: any, appState: any, authManager: any, actionsManager: any, componentManager: any, desktopManager: any, keyboardManager: any, modelManager: any, preferencesManager: any, privilegesManager: any, sessionHistory: any, syncManager: any);
    $rootScope: any;
    alertManager: any;
    appState: any;
    actionsManager: any;
    authManager: any;
    componentManager: any;
    desktopManager: any;
    keyboardManager: any;
    modelManager: any;
    preferencesManager: any;
    privilegesManager: any;
    syncManager: any;
    state: {
        componentStack: never[];
        editorDebounce: number;
        isDesktop: any;
        spellcheck: boolean;
        mutable: {
            tagsString: string;
        };
    };
    leftResizeControl: {};
    rightResizeControl: {};
    /** Used by .pug template */
    prefKeyMonospace: any;
    prefKeySpellcheck: any;
    prefKeyMarginResizers: any;
    addAppStateObserver(): void;
    handleNoteSelectionChange(note: any, previousNote: any): Promise<void>;
    addMappingObservers(): void;
    addSyncEventHandler(): void;
    addSyncStatusObserver(): void;
    syncStatusObserver: any;
    editorForNote(note: any): any;
    setMenuState(menu: any, state: any): void;
    toggleMenu(menu: any): void;
    closeAllMenus({ exclude }?: {
        exclude: any;
    }): void;
    editorMenuOnSelect: (component: any) => void;
    hasAvailableExtensions(): boolean;
    performFirefoxPinnedTabFix(): void;
    saveNote({ bypassDebouncer, updateClientModified, dontUpdatePreviews }: {
        bypassDebouncer: any;
        updateClientModified: any;
        dontUpdatePreviews: any;
    }): void;
    saveTimeout: any;
    didShowErrorAlert: boolean | undefined;
    showSavingStatus(): void;
    showAllChangesSavedStatus(): void;
    showErrorStatus(error: any): void;
    setStatus(status: any, wait?: boolean): void;
    statusTimeout: any;
    contentChanged(): void;
    onTitleEnter($event: any): void;
    onTitleChange(): void;
    focusEditor(): void;
    lastEditorFocusEventSource: any;
    focusTitle(): void;
    clickedTextArea(): void;
    onNameFocus(): void;
    editingName: boolean | undefined;
    onContentFocus(): void;
    onNameBlur(): void;
    selectedMenuItem(hide: any): void;
    deleteNote(permanently: any): Promise<void>;
    performNoteDeletion(note: any): void;
    restoreTrashedNote(): void;
    deleteNotePermanantely(): void;
    getTrashCount(): any;
    emptyTrash(): void;
    togglePin(): void;
    toggleLockNote(): void;
    toggleProtectNote(): void;
    toggleNotePreview(): void;
    toggleArchiveNote(): void;
    reloadTagsString(): void;
    addTag(tag: any): void;
    removeTag(tag: any): void;
    saveTags({ strings }?: {
        strings: any;
    }): void;
    onPanelResizeFinish: (width: any, left: any, isMaxWidth: any) => void;
    loadPreferences(): void;
    reloadFont(): void;
    toggleKey(key: any): Promise<void>;
    /** @components */
    onEditorLoad: (editor: any) => void;
    registerComponentHandler(): void;
    reloadComponentStackArray(): void;
    reloadComponentContext(): void;
    toggleStackComponentForCurrentItem(component: any): void;
    disassociateComponentWithCurrentNote(component: any): void;
    associateComponentWithCurrentNote(component: any): void;
    registerKeyboardShortcuts(): void;
    altKeyObserver: any;
    trashKeyObserver: any;
    deleteKeyObserver: any;
    onSystemEditorLoad(): void;
    loadedTabListener: boolean | undefined;
    tabObserver: any;
}
export {};
