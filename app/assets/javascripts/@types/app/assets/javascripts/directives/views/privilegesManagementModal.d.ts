export class PrivilegesManagementModal {
    restrict: string;
    template: any;
    controller: typeof PrivilegesManagementModalCtrl;
    controllerAs: string;
    bindToController: boolean;
    scope: {
        application: string;
    };
}
declare class PrivilegesManagementModalCtrl {
    constructor($timeout: any, $element: any);
    $element: any;
    onAppLaunch(): void;
    hasPasscode: any;
    hasAccount: boolean | undefined;
    displayInfoForCredential(credential: any): any;
    displayInfoForAction(action: any): any;
    isCredentialRequiredForAction(action: any, credential: any): any;
    clearSession(): Promise<void>;
    reloadPrivileges(): Promise<void>;
    availableActions: any;
    availableCredentials: any;
    sessionExpirey: any;
    sessionExpired: boolean | undefined;
    credentialDisplayInfo: {} | undefined;
    privileges: any;
    checkboxValueChanged(action: any, credential: any): void;
    cancel(): void;
    dismiss(): void;
}
export {};
