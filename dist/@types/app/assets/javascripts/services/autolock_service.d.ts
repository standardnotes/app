import { ApplicationService } from 'snjs';
export declare class AutolockService extends ApplicationService {
    private unsubState;
    private pollFocusInterval;
    private lastFocusState?;
    private lockAfterDate?;
    private lockTimeout?;
    onAppLaunch(): Promise<void>;
    observeVisibility(): void;
    deinit(): void;
    private lockApplication;
    setAutoLockInterval(interval: number): Promise<void>;
    getAutoLockInterval(): Promise<any>;
    /**
     *  Verify document is in focus every so often as visibilitychange event is
     *  not triggered on a typical window blur event but rather on tab changes.
     */
    beginWebFocusPolling(): void;
    getAutoLockIntervalOptions(): {
        value: number;
        label: string;
    }[];
    documentVisibilityChanged(visible: boolean): Promise<void>;
    beginAutoLockTimer(): Promise<void>;
    cancelAutoLockTimer(): void;
}
