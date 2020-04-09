export class ApplicationView {
    template: any;
    controller: typeof ApplicationViewCtrl;
    replace: boolean;
    controllerAs: string;
    bindToController: {
        application: string;
    };
}
declare class ApplicationViewCtrl extends PureCtrl {
    constructor($compile: any, $location: any, $rootScope: any, $timeout: any);
    $location: any;
    $rootScope: any;
    $compile: any;
    platformString: string;
    state: {
        appClass: string;
    };
    onDragDrop(event: any): void;
    onDragOver(event: any): void;
    openModalComponent(component: any): void;
    presentPermissionsDialog(dialog: any): void;
    lockScreenPuppet: any;
    loadApplication(): Promise<void>;
    onAppStart(): void;
    onAppLaunch(): void;
    onUpdateAvailable(): void;
    /** @override */
    onAppEvent(eventName: any): Promise<void>;
    syncStatus: any;
    completedInitialSync: boolean | undefined;
    /** @override */
    onAppStateEvent(eventName: any, data: any): Promise<void>;
    notesCollapsed: any;
    tagsCollapsed: any;
    updateLocalDataStatus(): void;
    updateSyncStatus(): void;
    showingDownloadStatus: boolean | undefined;
    uploadSyncStatus: any;
    overrideComponentManagerFunctions(): void;
    showInvalidSessionAlert(): void;
    lastShownDate: Date | undefined;
    addDragDropHandlers(): void;
    handleAutoSignInFromParams(): Promise<void>;
}
import { PureCtrl } from "./abstract/pure_ctrl";
export {};
