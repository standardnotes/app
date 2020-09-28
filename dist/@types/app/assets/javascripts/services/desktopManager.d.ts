/// <reference types="angular" />
import { SNComponent, PurePayload } from 'snjs';
import { WebApplication } from '@/ui_models/application';
import { ApplicationService, ApplicationEvent } from 'snjs';
import { Bridge } from './bridge';
declare type UpdateObserverCallback = (component: SNComponent) => void;
declare type ComponentActivationCallback = (payload: PurePayload) => void;
declare type ComponentActivationObserver = {
    id: string;
    callback: ComponentActivationCallback;
};
export declare class DesktopManager extends ApplicationService {
    private bridge;
    $rootScope: ng.IRootScopeService;
    $timeout: ng.ITimeoutService;
    componentActivationObservers: ComponentActivationObserver[];
    updateObservers: {
        callback: UpdateObserverCallback;
    }[];
    isDesktop: boolean;
    dataLoaded: boolean;
    lastSearchedText?: string;
    private removeComponentObserver?;
    constructor($rootScope: ng.IRootScopeService, $timeout: ng.ITimeoutService, application: WebApplication, bridge: Bridge);
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
    registerUpdateObserver(callback: UpdateObserverCallback): () => void;
    searchText(text?: string): void;
    redoSearch(): void;
    desktop_windowGainedFocus(): void;
    desktop_windowLostFocus(): void;
    desktop_onComponentInstallationComplete(componentData: any, error: any): Promise<void>;
    desktop_registerComponentActivationObserver(callback: ComponentActivationCallback): {
        id: string;
        callback: ComponentActivationCallback;
    };
    desktop_deregisterComponentActivationObserver(observer: ComponentActivationObserver): void;
    notifyComponentActivation(component: SNComponent): Promise<void>;
    desktop_requestBackupFile(): Promise<string | undefined>;
    desktop_didBeginBackup(): void;
    desktop_didFinishBackup(success: boolean): void;
}
export {};
