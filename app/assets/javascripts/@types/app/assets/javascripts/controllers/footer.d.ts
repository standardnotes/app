export class Footer {
    restrict: string;
    template: any;
    controller: typeof FooterCtrl;
    replace: boolean;
    controllerAs: string;
    bindToController: {
        application: string;
    };
}
declare class FooterCtrl {
    constructor($rootScope: any, $timeout: any);
    $rootScope: any;
    rooms: any[];
    themesWithIcons: any[];
    showSyncResolution: any;
    deinit(): void;
    unregisterComponent: any;
    rootScopeListener1: any;
    rootScopeListener2: any;
    closeAccountMenu: () => void;
    toggleSyncResolutionMenu: () => void;
    $onInit(): void;
    arbitraryStatusMessage: any;
    getInitialState(): {
        hasPasscode: boolean;
    };
    reloadUpgradeStatus(): void;
    onAppLaunch(): void;
    user: any;
    reloadPasscodeStatus(): Promise<void>;
    addRootScopeListeners(): void;
    /** @override */
    onAppStateEvent(eventName: any, data: any): void;
    backupStatus: any;
    /** @override */
    onAppKeyChange(): Promise<void>;
    /** @override */
    onAppEvent(eventName: any): void;
    showAccountMenu: any;
    streamItems(): void;
    queueExtReload: boolean | undefined;
    registerComponentHandler(): void;
    reloadExtendedData(): void;
    reloadInProgress: boolean | undefined;
    updateOfflineStatus(): void;
    offline: any;
    openSecurityUpdate(): void;
    findErrors(): void;
    error: any;
    accountMenuPressed(): void;
    lockApp(): void;
    refreshData(): void;
    isRefreshing: boolean | undefined;
    syncUpdated(): void;
    lastSyncDate: any;
    onNewUpdateAvailable(): void;
    newUpdateAvailable: boolean | undefined;
    clickedNewUpdateAnnouncement(): void;
    reloadDockShortcuts(): void;
    dockShortcuts: any;
    initSvgForShortcut(shortcut: any): void;
    selectShortcut(shortcut: any): void;
    onRoomDismiss(room: any): void;
    closeAllRooms(): void;
    selectRoom(room: any): Promise<void>;
    clickOutsideAccountMenu(): void;
}
export {};
