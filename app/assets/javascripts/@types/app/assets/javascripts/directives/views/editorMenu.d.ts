/// <reference types="pug" />
export class EditorMenu {
    restrict: string;
    template: import("pug").compileTemplate;
    controller: typeof EditorMenuCtrl;
    controllerAs: string;
    bindToController: boolean;
    scope: {
        callback: string;
        selectedEditor: string;
        currentItem: string;
        application: string;
    };
}
declare class EditorMenuCtrl {
    constructor($timeout: any);
    state: {
        isDesktop: any;
    };
    $onInit(): void;
    selectComponent(component: any): void;
    toggleDefaultForEditor(editor: any): void;
    offlineAvailableForComponent(component: any): any;
    makeEditorDefault(component: any): void;
    removeEditorDefault(component: any): void;
    shouldDisplayRunningLocallyLabel(component: any): boolean;
}
export {};
