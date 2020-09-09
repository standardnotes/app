/// <reference types="angular" />
import { WebApplication } from './application';
import { Bridge } from '@/services/bridge';
declare type AppManagerChangeCallback = () => void;
export declare class ApplicationGroup {
    private defaultSyncServerHost;
    private bridge;
    $compile: ng.ICompileService;
    $rootScope: ng.IRootScopeService;
    $timeout: ng.ITimeoutService;
    applications: WebApplication[];
    changeObservers: AppManagerChangeCallback[];
    activeApplication?: WebApplication;
    constructor($compile: ng.ICompileService, $rootScope: ng.IRootScopeService, $timeout: ng.ITimeoutService, defaultSyncServerHost: string, bridge: Bridge);
    private createDefaultApplication;
    /** @callback */
    onApplicationDeinit(application: WebApplication): void;
    private createNewApplication;
    get application(): WebApplication | undefined;
    getApplications(): WebApplication[];
    /**
     * Notifies observer when the active application has changed.
     * Any application which is no longer active is destroyed, and
     * must be removed from the interface.
     */
    addApplicationChangeObserver(callback: AppManagerChangeCallback): () => void;
    private notifyObserversOfAppChange;
}
export {};
