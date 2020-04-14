import { WebApplication } from '@/ui_models/application';
import { ApplicationService, WebPrefKey } from 'snjs';
export declare class PreferencesManager extends ApplicationService {
    private userPreferences;
    /** @override */
    onAppLaunch(): Promise<void>;
    get webApplication(): WebApplication;
    streamPreferences(): void;
    loadSingleton(): Promise<void>;
    preferencesDidChange(): void;
    syncUserPreferences(): void;
    getValue(key: WebPrefKey, defaultValue?: any): any;
    setUserPrefValue(key: WebPrefKey, value: any, sync?: boolean): void;
}
