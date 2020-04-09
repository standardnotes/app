export class LockManager {
    constructor(application: any);
    application: any;
    observeVisibility(): void;
    unsubState: any;
    deinit(): void;
    setAutoLockInterval(interval: any): Promise<any>;
    getAutoLockInterval(): Promise<any>;
    /**
     *  Verify document is in focus every so often as visibilitychange event is
     *  not triggered on a typical window blur event but rather on tab changes.
     */
    beginWebFocusPolling(): void;
    pollFocusInterval: NodeJS.Timeout | undefined;
    lastFocusState: string | undefined;
    getAutoLockIntervalOptions(): {
        value: number;
        label: string;
    }[];
    documentVisibilityChanged(visible: any): Promise<void>;
    beginAutoLockTimer(): Promise<void>;
    lockAfterDate: Date | null | undefined;
    lockTimeout: NodeJS.Timeout | undefined;
    cancelAutoLockTimer(): void;
}
