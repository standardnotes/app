import { WebApplication } from '@/ui_models/application';
import { ApplicationService, WebPrefKey } from 'snjs';
export declare class PreferencesManager extends ApplicationService {
    private userPreferences;
    private loadingPrefs;
    /** @override */
    onAppLaunch(): Promise<void>;
    get webApplication(): WebApplication;
    streamPreferences(): void;
    private loadSingleton;
    syncUserPreferences(): void;
    getValue(key: WebPrefKey, defaultValue?: any): any;
    setUserPrefValue(key: WebPrefKey, value: any, sync?: boolean): Promise<void>;
}
