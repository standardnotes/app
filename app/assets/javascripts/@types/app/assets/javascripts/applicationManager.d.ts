export class ApplicationManager {
    constructor($compile: any, $rootScope: any, $timeout: any);
    $compile: any;
    $timeout: any;
    $rootScope: any;
    applications: any[];
    changeObservers: any[];
    /** @callback */
    onApplicationDeinit(application: any): void;
    /** @access private */
    createDefaultApplication(): void;
    activeApplication: WebApplication | null | undefined;
    /** @access private */
    createNewApplication(): WebApplication;
    get application(): WebApplication | null | undefined;
    /** @access public */
    getApplications(): any[];
    /**
     * Notifies observer when the active application has changed.
     * Any application which is no longer active is destroyed, and
     * must be removed from the interface.
     * @access public
     * @param {function} callback
     */
    addApplicationChangeObserver(callback: Function): void;
    notifyObserversOfAppChange(): void;
}
import { WebApplication } from "./application";
