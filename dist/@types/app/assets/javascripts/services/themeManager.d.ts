import { WebApplication } from '@/ui_models/application';
import { ApplicationService } from 'snjs';
export declare class ThemeManager extends ApplicationService {
    private activeThemes;
    private unsubState;
    private unregisterDesktop;
    private unregisterComponent;
    constructor(application: WebApplication);
    get webApplication(): WebApplication;
    deinit(): void;
    /** @override */
    onAppStart(): Promise<void>;
    private activateCachedThemes;
    private registerObservers;
    deactivateAllThemes(): void;
    private activateTheme;
    private deactivateTheme;
    private cacheThemes;
    private decacheThemes;
    private getCachedThemes;
}
