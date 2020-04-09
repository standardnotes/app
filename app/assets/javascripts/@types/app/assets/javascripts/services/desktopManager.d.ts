export class DesktopManager extends ApplicationService {
    constructor($rootScope: any, $timeout: any, application: any);
    $rootScope: any;
    $timeout: any;
    componentActivationObservers: any[];
    updateObservers: any[];
    isDesktop: any;
    /** @override */
    onAppEvent(eventName: any): void;
    dataLoaded: boolean | undefined;
    saveBackup(): void;
    getExtServerHost(): any;
    /**
     * Sending a component in its raw state is really slow for the desktop app
     * Keys are not passed into ItemParams, so the result is not encrypted
     */
    convertComponentForTransmission(component: any): Promise<any>;
    syncComponentsInstallation(components: any): void;
    installComponent(component: any): Promise<void>;
    registerUpdateObserver(callback: any): () => void;
    searchText(text: any): void;
    lastSearchedText: any;
    redoSearch(): void;
    desktop_setSearchHandler(handler: any): void;
    searchHandler: any;
    desktop_windowGainedFocus(): void;
    desktop_windowLostFocus(): void;
    desktop_onComponentInstallationComplete(componentData: any, error: any): Promise<void>;
    desktop_registerComponentActivationObserver(callback: any): {
        id: () => number;
        callback: any;
    };
    desktop_deregisterComponentActivationObserver(observer: any): void;
    notifyComponentActivation(component: any): Promise<void>;
    desktop_setExtServerHost(host: any): void;
    extServerHost: any;
    desktop_setComponentInstallationSyncHandler(handler: any): void;
    installationSyncHandler: any;
    desktop_setInstallComponentHandler(handler: any): void;
    installComponentHandler: any;
    desktop_setInitialDataLoadHandler(handler: any): void;
    dataLoadHandler: any;
    desktop_requestBackupFile(callback: any): Promise<void>;
    desktop_setMajorDataChangeHandler(handler: any): void;
    majorDataChangeHandler: any;
    desktop_didBeginBackup(): void;
    desktop_didFinishBackup(success: any): void;
}
import { ApplicationService } from "../../../../../../../../../../Users/mo/Desktop/sn/dev/snjs/dist/@types";
