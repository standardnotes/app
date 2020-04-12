export class ThemeManager extends ApplicationService {
    constructor(application: any);
    activeThemes: any[];
    unsubState: any;
    unregisterDesktop: any;
    unregisterComponent: any;
    /** @override */
    onAppStart(): void;
    /** @access private */
    activateCachedThemes(): Promise<void>;
    /** @access private */
    registerObservers(): void;
    /** @access public */
    deactivateAllThemes(): void;
    /** @access private */
    activateTheme(theme: any, writeToCache?: boolean): void;
    /** @access private */
    deactivateTheme(theme: any): void;
    /** @access private */
    cacheThemes(): Promise<void>;
    /** @access private */
    decacheThemes(): Promise<void>;
    /** @access private */
    getCachedThemes(): Promise<import("../../../../../snjs/dist/@types/models/core/item").SNItem[]>;
}
import { ApplicationService } from "../../../../../../../../../../Users/mo/Desktop/sn/dev/snjs/dist/@types";
