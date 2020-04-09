export class TagsPanel {
    restrict: string;
    scope: {
        application: string;
    };
    template: any;
    replace: boolean;
    controller: typeof TagsPanelCtrl;
    controllerAs: string;
    bindToController: boolean;
}
declare class TagsPanelCtrl {
    constructor($timeout: any);
    panelPuppet: {
        onReady: () => void;
    };
    deinit(): void;
    unregisterComponent: any;
    getInitialState(): {
        tags: never[];
        smartTags: never[];
        noteCounts: {};
    };
    onAppStart(): void;
    onAppLaunch(): void;
    /** @override */
    onAppSync(): void;
    /**
     * Returns all officially saved tags as reported by the model manager.
     * @access private
     */
    getMappedTags(): any;
    beginStreamingItems(): void;
    /** @override */
    onAppStateEvent(eventName: any, data: any): void;
    /** @override */
    onAppEvent(eventName: any): Promise<void>;
    reloadNoteCounts(): void;
    loadPreferences(): void;
    onPanelResize: (newWidth: any, lastLeft: any, isAtMaxWidth: any, isCollapsed: any) => void;
    registerComponentHandler(): void;
    component: any;
    selectTag(tag: any): Promise<void>;
    clickedAddNewTag(): Promise<void>;
    tagTitleDidChange(tag: any): void;
    saveTag($event: any, tag: any): Promise<void>;
    editingOriginalName: any;
    selectedRenameTag($event: any, tag: any): Promise<void>;
    selectedDeleteTag(tag: any): void;
    removeTag(tag: any): void;
}
export {};
