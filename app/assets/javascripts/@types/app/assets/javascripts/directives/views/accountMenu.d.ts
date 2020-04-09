export class AccountMenu {
    restrict: string;
    template: any;
    controller: typeof AccountMenuCtrl;
    controllerAs: string;
    bindToController: boolean;
    scope: {
        closeFunction: string;
        application: string;
    };
}
declare class AccountMenuCtrl {
    constructor($timeout: any, appVersion: any);
    appVersion: any;
    /** @override */
    getInitialState(): {
        appVersion: string;
        passcodeAutoLockOptions: any;
        user: any;
        formData: {
            mergeLocal: boolean;
            ephemeral: boolean;
        };
        mutable: {};
    };
    onAppKeyChange(): Promise<void>;
    onAppLaunch(): Promise<void>;
    refreshedCredentialState(): {
        user: any;
        canAddPasscode: boolean;
        hasPasscode: any;
        showPasscodeForm: boolean;
    };
    $onInit(): void;
    syncStatus: any;
    close(): void;
    loadHost(): Promise<void>;
    onHostInputChange(): void;
    loadBackupsAvailability(): Promise<void>;
    submitMfaForm(): void;
    blurAuthFields(): void;
    submitAuthForm(): void;
    setFormDataState(formData: any): Promise<any>;
    login(): Promise<void>;
    register(): Promise<void>;
    mergeLocalChanged(): void;
    openPasswordWizard(): void;
    openPrivilegesModal(): Promise<void>;
    destroyLocalData(): void;
    submitImportPassword(): Promise<void>;
    readFile(file: any): Promise<any>;
    /**
     * @template
     */
    importFileSelected<(Missing)>(files: any): Promise<void>;
    performImport(data: any, password: any): Promise<void>;
    importJSONData(data: any, password: any): Promise<any>;
    downloadDataArchive(): Promise<void>;
    notesAndTagsCount(): any;
    encryptionStatusForNotes(): string;
    reloadAutoLockInterval(): Promise<void>;
    selectAutoLockInterval(interval: any): Promise<void>;
    hidePasswordForm(): void;
    hasPasscode(): any;
    addPasscodeClicked(): void;
    submitPasscodeForm(): void;
    changePasscodePressed(): Promise<void>;
    removePasscodePressed(): Promise<void>;
    isDesktopApplication(): any;
}
export {};
