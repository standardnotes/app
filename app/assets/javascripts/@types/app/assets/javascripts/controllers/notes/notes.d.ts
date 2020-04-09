export class NotesPanel {
    template: any;
    replace: boolean;
    controller: typeof NotesCtrl;
    controllerAs: string;
    bindToController: boolean;
    scope: {
        application: string;
    };
}
declare class NotesCtrl {
    constructor($timeout: any);
    $onInit(): void;
    panelPuppet: {
        onReady: () => void;
    } | null | undefined;
    onWindowResize(): void;
    deinit(): void;
    onPanelResize: (newWidth: any, lastLeft: any, isAtMaxWidth: any, isCollapsed: any) => void;
    getInitialState(): {
        notes: never[];
        renderedNotes: never[];
        selectedNote: null;
        tag: null;
        sortBy: null;
        showArchived: null;
        hidePinned: null;
        sortReverse: null;
        panelTitle: null;
        mutable: {
            showMenu: boolean;
        };
        noteFilter: {
            text: string;
        };
    };
    onAppLaunch(): void;
    /** @override */
    onAppStateEvent(eventName: any, data: any): void;
    /** @override */
    onAppEvent(eventName: any): Promise<void>;
    /**
     * @access private
     * Access the current state notes without awaiting any potential reloads
     * that may be in progress. This is the sync alternative to `async getMostValidNotes`
     */
    getPossiblyStaleNotes(): any;
    /**
     * @access private
     * Access the current state notes after waiting for any pending reloads.
     * This returns the most up to date notes, but is the asyncronous counterpart
     * to `getPossiblyStaleNotes`
     */
    getMostValidNotes(): Promise<any>;
    /**
     * Triggered programatically to create a new placeholder note
     * when conditions allow for it. This is as opposed to creating a new note
     * as part of user interaction (pressing the + button).
     * @access private
     */
    createPlaceholderNote(): Promise<void>;
    streamNotesAndTags(): void;
    selectNote(note: any): Promise<any>;
    createNewNote(): Promise<void>;
    handleTagChange(tag: any, previousTag: any): Promise<void>;
    resetScrollPosition(): void;
    removeNoteFromList(note: any): Promise<void>;
    reloadNotes(): Promise<void>;
    reloadNotesPromise: Promise<void> | undefined;
    performPeloadNotes(): Promise<void>;
    setShowMenuFalse(): void;
    handleNoteSelection(note: any): Promise<void>;
    selectedIndex: number | undefined;
    reloadPreferences(): void;
    paginate(): void;
    resetPagination({ keepCurrentIfLarger }?: {
        keepCurrentIfLarger: any;
    }): void;
    pageSize: number | undefined;
    notesToDisplay: number | undefined;
    reloadPanelTitle(): void;
    optionsSubtitle(): string;
    loadFlagsForNote(note: any): {
        text: string;
        class: string;
    }[];
    displayableNotes(): any;
    getFirstNonProtectedNote(): any;
    selectFirstNote(): void;
    selectNextNote(): void;
    selectNextOrCreateNew(): void;
    selectPreviousNote(): boolean;
    isFiltering(): boolean;
    setNoteFilterText(text: any): Promise<void>;
    clearFilterText(): Promise<void>;
    filterTextChanged(): Promise<void>;
    searchSubmitted: boolean | undefined;
    onFilterEnter(): void;
    selectedMenuItem(): void;
    togglePrefKey(key: any): void;
    selectedSortByCreated(): void;
    selectedSortByUpdated(): void;
    selectedSortByTitle(): void;
    toggleReverseSort(): void;
    setSortBy(type: any): void;
    shouldShowTagsForNote(note: any): boolean;
    getSearchBar(): HTMLElement | null;
    registerKeyboardShortcuts(): void;
    /**
     * In the browser we're not allowed to override cmd/ctrl + n, so we have to
     * use Control modifier as well. These rules don't apply to desktop, but
     * probably better to be consistent.
     */
    newNoteKeyObserver: any;
    nextNoteKeyObserver: any;
    searchKeyObserver: any;
}
export {};
