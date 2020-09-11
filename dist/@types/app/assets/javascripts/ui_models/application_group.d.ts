/// <reference types="angular" />
import { SNApplicationGroup } from 'snjs';
import { Bridge } from '@/services/bridge';
export declare class ApplicationGroup extends SNApplicationGroup {
    private defaultSyncServerHost;
    private bridge;
    $compile: ng.ICompileService;
    $rootScope: ng.IRootScopeService;
    $timeout: ng.ITimeoutService;
    constructor($compile: ng.ICompileService, $rootScope: ng.IRootScopeService, $timeout: ng.ITimeoutService, defaultSyncServerHost: string, bridge: Bridge);
    initialize(callback?: any): Promise<void>;
    private createApplication;
}
