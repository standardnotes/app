export class Database {
    locked: boolean;
    /** @access public */
    deinit(): void;
    alertService: any;
    db: any;
    /** @access public */
    setApplication(application: any): void;
    /**
     * Relinquishes the lock and allows db operations to proceed
     * @access public
     */
    unlock(): void;
    /**
     * Opens the database natively, or returns the existing database object if already opened.
     * @access public
     * @param {function} onNewDatabase - Callback to invoke when a database has been created
     * as part of the open process. This can happen on new application sessions, or if the
     * browser deleted the database without the user being aware.
     */
    openDatabase(onNewDatabase: Function): Promise<any>;
    /** @access public */
    getAllPayloads(): Promise<any>;
    /** @access public */
    savePayload(payload: any): Promise<any>;
    /** @access public */
    savePayloads(payloads: any): Promise<any>;
    /** @access private */
    putItems(objectStore: any, items: any): Promise<[any, any, any, any, any, any, any, any, any, any]>;
    /** @access public */
    deletePayload(uuid: any): Promise<any>;
    /** @access public */
    clearAllPayloads(): Promise<any>;
    /** @access private */
    showAlert(message: any): void;
    /**
     * @access private
     * @param {object} error - {code, name}
     */
    showGenericError(error: object): void;
    /** @access private */
    displayOfflineAlert(): void;
}
