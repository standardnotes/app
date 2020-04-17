/// <reference types="angular" />
import { ApplicationEvent } from 'snjs';
import { WebApplication } from '@/ui_models/application';
export declare type CtrlState = Partial<Record<string, any>>;
export declare type CtrlProps = Partial<Record<string, any>>;
export declare class PureViewCtrl {
    $timeout: ng.ITimeoutService;
    /** Passed through templates */
    application: WebApplication;
    props: CtrlProps;
    state: CtrlState;
    private unsubApp;
    private unsubState;
    private stateTimeout;
    constructor($timeout: ng.ITimeoutService);
    $onInit(): void;
    deinit(): void;
    $onDestroy(): void;
    get appState(): import("../../ui_models/app_state").AppState;
    /** @private */
    resetState(): Promise<void>;
    /** @override */
    getInitialState(): {};
    setState(state: CtrlState): Promise<unknown>;
    updateUI(func: () => void): Promise<void>;
    initProps(props: CtrlProps): void;
    addAppStateObserver(): void;
    onAppStateEvent(eventName: any, data: any): void;
    addAppEventObserver(): void;
    onAppEvent(eventName: ApplicationEvent): void;
    /** @override */
    onAppStart(): Promise<void>;
    onAppLaunch(): Promise<void>;
    onAppKeyChange(): Promise<void>;
    onAppSync(): void;
}
