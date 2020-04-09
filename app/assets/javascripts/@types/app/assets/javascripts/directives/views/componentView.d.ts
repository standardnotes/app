export class ComponentView {
    restrict: string;
    template: any;
    scope: {
        component: string;
        onLoad: string;
        manualDealloc: string;
        application: string;
    };
    controller: typeof ComponentViewCtrl;
    controllerAs: string;
    bindToController: boolean;
}
declare class ComponentViewCtrl {
    constructor($scope: any, $rootScope: any, $timeout: any);
    $rootScope: any;
    $timeout: any;
    componentValid: boolean;
    cleanUpOn: any;
    onVisibilityChange(): void;
    $onDestroy(): void;
    unregisterComponentHandler: any;
    unregisterDesktopObserver: any;
    component: any;
    onLoad: any;
    application: any;
    $onChanges(): void;
    didRegisterObservers: boolean | undefined;
    lastComponentValue: any;
    registerPackageUpdateObserver(): void;
    registerComponentHandlers(): void;
    reloadComponent(): Promise<void>;
    reloadStatus(doManualReload?: boolean): void;
    reloading: boolean | undefined;
    expired: boolean | undefined;
    loading: boolean | undefined;
    error: string | null | undefined;
    handleActivation(): void;
    loadTimeout: any;
    handleIframeLoadTimeout(): Promise<void>;
    issueLoading: boolean | undefined;
    didAttemptReload: boolean | undefined;
    handleIframeLoad(iframe: any): Promise<void>;
    disableActiveTheme(): void;
    getUrl(): any;
}
export {};
