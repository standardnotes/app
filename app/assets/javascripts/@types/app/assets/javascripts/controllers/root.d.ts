export class Root {
    template: any;
    controller: typeof RootCtrl;
    replace: boolean;
    controllerAs: string;
    bindToController: boolean;
}
declare class RootCtrl {
    constructor($timeout: any, applicationManager: any);
    $timeout: any;
    applicationManager: any;
    reload(): void;
    applications: any;
}
export {};
