export class InputModal {
    restrict: string;
    template: any;
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
