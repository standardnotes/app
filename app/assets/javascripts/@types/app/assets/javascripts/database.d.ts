import { SNAlertService } from "../../../../snjs/dist/@types";
export declare class Database {
    private locked;
    private alertService?;
    private db?;
    deinit(): void;
    setAlertService(alertService: SNAlertService): void;
    /**
     * Relinquishes the lock and allows db operations to proceed
     */
    unlock(): void;
    /**
     * Opens the database natively, or returns the existing database object if already opened.
     * @param onNewDatabase - Callback to invoke when a database has been created
     * as part of the open process. This can happen on new application sessions, or if the
     * browser deleted the database without the user being aware.
     */
    openDatabase(onNewDatabase?: () => void): Promise<IDBDatabase | undefined>;
    getAllPayloads(): Promise<any[]>;
    savePayload(payload: any): Promise<void>;
    savePayloads(payloads: any[]): Promise<void>;
    private putItems;
    deletePayload(uuid: string): Promise<void>;
    clearAllPayloads(): Promise<void>;
    private showAlert;
    private showGenericError;
    private displayOfflineAlert;
}
