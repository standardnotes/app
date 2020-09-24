/// <reference types="angular" />
import { ApplicationEvent } from 'snjs';
import { WebApplication } from '@/ui_models/application';
export declare type CtrlState = Partial<Record<string, any>>;
export declare type CtrlProps = Partial<Record<string, any>>;
export declare class PureViewCtrl<P = CtrlProps, S = CtrlState> {
    props: P;
    $timeout: ng.ITimeoutService;
    /** Passed through templates */
    application: WebApplication;
    state: S;
    private unsubApp;
    private unsubState;
    private stateTimeout?;
    /**
     * Subclasses can optionally add an ng-if=ctrl.templateReady to make sure that
     * no Angular handlebars/syntax render in the UI before display data is ready.
     */
    protected templateReady: boolean;
    constructor($timeout: ng.ITimeoutService, props?: P);
    $onInit(): void;
    deinit(): void;
    $onDestroy(): void;
    get appState(): import("../../ui_models/app_state").AppState;
    /** @private */
    resetState(): Promise<void>;
    /** @override */
    getInitialState(): S;
    setState(state: Partial<S>): Promise<unknown>;
    /** @returns a promise that resolves after the UI has been updated. */
    flushUI(): import("angular").IPromise<void>;
    initProps(props: CtrlProps): void;
    addAppStateObserver(): void;
    onAppStateEvent(eventName: any, data: any): void;
    addAppEventObserver(): void;
    onAppEvent(eventName: ApplicationEvent): void;
    /** @override */
    onAppStart(): Promise<void>;
    onAppLaunch(): Promise<void>;
    onAppKeyChange(): Promise<void>;
    onAppIncrementalSync(): void;
    onAppFullSync(): void;
}
