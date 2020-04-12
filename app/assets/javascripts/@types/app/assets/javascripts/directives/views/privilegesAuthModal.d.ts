/// <reference types="pug" />
export class PrivilegesAuthModal {
    restrict: string;
    template: import("pug").compileTemplate;
    controller: typeof PrivilegesAuthModalCtrl;
    controllerAs: string;
    bindToController: boolean;
    scope: {
        action: string;
        onSuccess: string;
        onCancel: string;
        application: string;
    };
}
declare class PrivilegesAuthModalCtrl {
    constructor($element: any, $timeout: any);
    $element: any;
    $timeout: any;
    $onInit(): void;
    authParameters: {} | undefined;
    sessionLengthOptions: any;
    selectedSessionLength: any;
    requiredCredentials: any;
    selectSessionLength(length: any): void;
    promptForCredential(credential: any): any;
    cancel(): void;
    isCredentialInFailureState(credential: any): boolean;
    validate(): boolean;
    failedCredentials: any;
    submit(): Promise<void>;
    dismiss(): void;
}
export {};
