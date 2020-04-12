/// <reference types="pug" />
export class InputModal {
    restrict: string;
    template: import("pug").compileTemplate;
    controller: typeof InputModalCtrl;
    controllerAs: string;
    bindToController: boolean;
    scope: {
        type: string;
        title: string;
        message: string;
        placeholder: string;
        callback: string;
    };
}
declare class InputModalCtrl {
    constructor($element: any);
    $element: any;
    formData: {};
    dismiss(): void;
    submit(): void;
}
export {};
