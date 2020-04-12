/// <reference types="pug" />
export class RevisionPreviewModal {
    restrict: string;
    template: import("pug").compileTemplate;
    controller: typeof RevisionPreviewModalCtrl;
    controllerAs: string;
    bindToController: boolean;
    scope: {
        uuid: string;
        content: string;
        application: string;
    };
}
declare class RevisionPreviewModalCtrl {
    constructor($element: any, $timeout: any);
    $element: any;
    $timeout: any;
    $onInit(): void;
    $onDestroy(): void;
    unregisterComponent: any;
    configure(): Promise<void>;
    note: any;
    editor: any;
    restore(asCopy: any): void;
    dismiss(): void;
}
export {};
