export class SessionHistoryMenu {
    restrict: string;
    template: any;
    controller: typeof SessionHistoryMenuCtrl;
    controllerAs: string;
    bindToController: boolean;
    scope: {
        item: string;
        application: string;
    };
}
declare class SessionHistoryMenuCtrl {
    constructor($timeout: any);
    $timeout: any;
    $onInit(): void;
    diskEnabled: any;
    autoOptimize: any;
    reloadHistory(): void;
    entries: any;
    history: any;
    openRevision(revision: any): void;
    classForRevision(revision: any): "default" | "success" | "danger" | undefined;
    clearItemHistory(): void;
    clearAllHistory(): void;
    toggleDiskSaving(): void;
    toggleAutoOptimize(): void;
}
export {};
