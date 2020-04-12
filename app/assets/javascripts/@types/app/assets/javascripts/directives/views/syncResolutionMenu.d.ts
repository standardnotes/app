/// <reference types="pug" />
export class SyncResolutionMenu {
    restrict: string;
    template: import("pug").compileTemplate;
    controller: typeof SyncResolutionMenuCtrl;
    controllerAs: string;
    bindToController: boolean;
    scope: {
        closeFunction: string;
        application: string;
    };
}
declare class SyncResolutionMenuCtrl {
    constructor($timeout: any);
    $timeout: any;
    status: {};
    downloadBackup(encrypted: any): void;
    skipBackup(): void;
    performSyncResolution(): Promise<void>;
    close(): void;
}
export {};
