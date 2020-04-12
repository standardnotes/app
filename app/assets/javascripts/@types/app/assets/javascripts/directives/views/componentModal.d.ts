/// <reference types="pug" />
export class ComponentModalCtrl {
    constructor($element: any);
    $element: any;
    dismiss(): void;
}
export class ComponentModal {
    restrict: string;
    template: import("pug").compileTemplate;
    controller: typeof ComponentModalCtrl;
    controllerAs: string;
    bindToController: boolean;
    scope: {
        show: string;
        component: string;
        callback: string;
        onDismiss: string;
        application: string;
    };
}
