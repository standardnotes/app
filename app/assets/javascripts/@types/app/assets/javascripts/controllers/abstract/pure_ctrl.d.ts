export class PureCtrl {
    constructor($timeout: any);
    $timeout: any;
    props: any;
    state: any;
    $onInit(): void;
    deinit(): void;
    unsubApp: any;
    unsubState: any;
    application: any;
    $onDestroy(): void;
    /** @private */
    private resetState;
    /** @override */
    getInitialState(): {};
    setState(state: any): Promise<any>;
    stateTimeout: any;
    initProps(props: any): void;
    addAppStateObserver(): void;
    onAppStateEvent(eventName: any, data: any): void;
    addAppEventObserver(): void;
    onAppEvent(eventName: any): void;
    /** @override */
    onAppStart(): Promise<void>;
    onAppLaunch(): Promise<void>;
    onAppKeyChange(): Promise<void>;
    onAppSync(): void;
}
