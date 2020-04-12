/// <reference types="pug" />
export class PermissionsModal {
    restrict: string;
    template: import("pug").compileTemplate;
    controller: typeof PermissionsModalCtrl;
    controllerAs: string;
    bindToController: boolean;
    scope: {
        show: string;
        component: string;
        permissionsString: string;
        callback: string;
    };
}
declare class PermissionsModalCtrl {
    constructor($element: any);
    $element: any;
    dismiss(): void;
    accept(): void;
    deny(): void;
}
export {};
