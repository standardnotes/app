import { WebApplication } from '@/ui_models/application';
import { ApplicationService, WebPrefKey } from 'snjs';
export declare class PreferencesManager extends ApplicationService {
    private userPreferences;
    private loadingPrefs;
    private unubscribeStreamItems?;
    /** @override */
    onAppLaunch(): Promise<void>;
    deinit(): void;
    get webApplication(): WebApplication;
    streamPreferences(): void;
    private reloadSingleton;
    syncUserPreferences(): void;
    getValue(key: WebPrefKey, defaultValue?: any): any;
    setUserPrefValue(key: WebPrefKey, value: any, sync?: boolean): Promise<void>;
}
