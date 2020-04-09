export class EditorPanel {
    restrict: string;
    scope: {
        application: string;
    };
    template: any;
    replace: boolean;
    controller: typeof EditorCtrl;
    controllerAs: string;
    bindToController: boolean;
}
declare class EditorCtrl {
    constructor($timeout: any);
    leftPanelPuppet: {
        onReady: () => void;
    };
    rightPanelPuppet: {
        onReady: () => void;
    };
    /** Used by .pug template */
    prefKeyMonospace: string;
    prefKeySpellcheck: string;
    prefKeyMarginResizers: string;
    deinit(): void;
    /** @components */
    onEditorLoad: (editor: any) => void;
    unregisterComponent: any;
    $onInit(): void;
    /** @override */
    getInitialState(): {
        componentStack: never[];
        editorDebounce: number;
        isDesktop: any;
        spellcheck: boolean;
        mutable: {
            tagsString: string;
        };
    };
    onAppLaunch(): void;
    /** @override */
    onAppStateEvent(eventName: any, data: any): void;
    /** @override */
    onAppEvent(eventName: any): void;
    /**
     * Because note.locked accesses note.content.appData,
     * we do not want to expose the template to direct access to note.locked,
     * otherwise an exception will occur when trying to access note.locked if the note
     * is deleted. There is potential for race conditions to occur with setState, where a
     * previous setState call may have queued a digest cycle, and the digest cycle triggers
     * on a deleted note.
     */
    get noteLocked(): any;
    streamItems(): void;
    handleNoteSelectionChange(note: any, previousNote: any): Promise<void>;
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
    showSavingStatus(): void;
    showAllChangesSavedStatus(): void;
    showErrorStatus(error: any): void;
    setStatus(status: any, wait?: boolean): void;
    statusTimeout: any;
    contentChanged(): void;
    onTitleEnter($event: any): void;
    onTitleChange(): void;
    focusEditor(): void;
    lastEditorFocusEventSource: number | null | undefined;
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
    }): Promise<void>;
    onPanelResizeFinish: (width: any, left: any, isMaxWidth: any) => void;
    reloadPreferences(): void;
    reloadFont(): void;
    toggleKey(key: any): Promise<void>;
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
    tabObserver: any;
    removeTabObserver(): void;
}
export {};
