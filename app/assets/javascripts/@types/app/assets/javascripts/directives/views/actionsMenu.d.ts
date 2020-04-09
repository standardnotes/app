export class ActionsMenu {
    restrict: string;
    template: any;
    replace: boolean;
    controller: typeof ActionsMenuCtrl;
    controllerAs: string;
    bindToController: boolean;
    scope: {
        item: string;
        application: string;
    };
}
declare class ActionsMenuCtrl {
    constructor($timeout: any);
    state: {
        extensions: never[];
    };
    $onInit(): void;
    loadExtensions(): Promise<void>;
    executeAction(action: any, extension: any): Promise<void>;
    handleActionResult(action: any, result: any): void;
    subRowsForAction(parentAction: any, extension: any): any;
}
export {};
