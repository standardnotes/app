export class PasswordWizard {
    restrict: string;
    template: any;
    controller: typeof PasswordWizardCtrl;
    controllerAs: string;
    bindToController: boolean;
    scope: {
        type: string;
        application: string;
    };
}
declare class PasswordWizardCtrl {
    constructor($element: any, $timeout: any);
    $element: any;
    $timeout: any;
    $onInit(): void;
    $onDestroy(): void;
    /** Confirms with user before closing tab */
    registerWindowUnloadStopper(): void;
    resetContinueState(): void;
    isContinuing: boolean | undefined;
    nextStep(): Promise<void>;
    setFormDataState(formData: any): Promise<any>;
    validateCurrentPassword(): Promise<any>;
    processPasswordChange(): Promise<boolean>;
    dismiss(): void;
}
export {};
