/// <reference types="angular" />
import { SNComponent, PurePayload } from 'snjs';
import { WebApplication } from '@/ui_models/application';
import { ApplicationService, ApplicationEvent } from 'snjs';
declare type UpdateObserverCallback = (component: SNComponent) => void;
declare type ComponentActivationCallback = (payload: PurePayload) => void;
declare type ComponentActivationObserver = {
    id: string;
    callback: ComponentActivationCallback;
};
export declare class DesktopManager extends ApplicationService {
    $rootScope: ng.IRootScopeService;
    $timeout: ng.ITimeoutService;
    componentActivationObservers: ComponentActivationObserver[];
    updateObservers: {
        callback: UpdateObserverCallback;
    }[];
    isDesktop: any;
    dataLoaded: boolean;
    dataLoadHandler?: () => void;
    majorDataChangeHandler?: () => void;
    extServerHost?: string;
    installationSyncHandler?: (payloads: PurePayload[]) => void;
    installComponentHandler?: (payload: PurePayload) => void;
    lastSearchedText?: string;
    searchHandler?: (text?: string) => void;
    constructor($rootScope: ng.IRootScopeService, $timeout: ng.ITimeoutService, application: WebApplication);
    get webApplication(): WebApplication;
    deinit(): void;
    onAppEvent(eventName: ApplicationEvent): Promise<void>;
    saveBackup(): void;
    getExtServerHost(): string | undefined;
    /**
     * Sending a component in its raw state is really slow for the desktop app
     * Keys are not passed into ItemParams, so the result is not encrypted
     */
    convertComponentForTransmission(component: SNComponent): Promise<PurePayload>;
    syncComponentsInstallation(components: SNComponent[]): void;
    installComponent(component: SNComponent): Promise<void>;
    registerUpdateObserver(callback: UpdateObserverCallback): () => void;
    searchText(text?: string): void;
    redoSearch(): void;
    desktop_setSearchHandler(handler: (text?: string) => void): void;
    desktop_windowGainedFocus(): void;
    desktop_windowLostFocus(): void;
    desktop_onComponentInstallationComplete(componentData: any, error: any): Promise<void>;
    desktop_registerComponentActivationObserver(callback: ComponentActivationCallback): {
        id: string;
        callback: ComponentActivationCallback;
    };
    desktop_deregisterComponentActivationObserver(observer: ComponentActivationObserver): void;
    notifyComponentActivation(component: SNComponent): Promise<void>;
    desktop_setExtServerHost(host: string): void;
    desktop_setComponentInstallationSyncHandler(handler: (payloads: PurePayload[]) => void): void;
    desktop_setInstallComponentHandler(handler: (payload: PurePayload) => void): void;
    desktop_setInitialDataLoadHandler(handler: () => void): void;
    desktop_requestBackupFile(callback: (data: any) => void): Promise<void>;
    desktop_setMajorDataChangeHandler(handler: () => void): void;
    desktop_didBeginBackup(): void;
    desktop_didFinishBackup(success: boolean): void;
}
export {};
