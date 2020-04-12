/// <reference types="pug" />
export class ConflictResolutionModal {
    restrict: string;
    template: import("pug").compileTemplate;
    controller: typeof ConflictResolutionCtrl;
    controllerAs: string;
    bindToController: boolean;
    scope: {
        item1: string;
        item2: string;
        callback: string;
        application: string;
    };
}
declare class ConflictResolutionCtrl {
    constructor($element: any);
    $element: any;
    $onInit(): void;
    contentType: any;
    item1Content: string | undefined;
    item2Content: string | undefined;
    createContentString(item: any): string;
    keepItem1(): void;
    keepItem2(): void;
    keepBoth(): void;
    export(): void;
    triggerCallback(): void;
    dismiss(): void;
}
export {};
