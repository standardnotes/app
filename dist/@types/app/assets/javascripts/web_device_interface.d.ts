import { DeviceInterface, SNApplication } from 'snjs';
export declare class WebDeviceInterface extends DeviceInterface {
    private database;
    constructor(namespace: string, timeout: any);
    setApplication(application: SNApplication): void;
    deinit(): void;
    getRawStorageValue(key: string): Promise<string | null>;
    getAllRawStorageKeyValues(): Promise<{
        key: string;
        value: any;
    }[]>;
    setRawStorageValue(key: string, value: any): Promise<void>;
    removeRawStorageValue(key: string): Promise<void>;
    removeAllRawStorageValues(): Promise<void>;
    openDatabase(): Promise<{
        isNewDatabase?: boolean | undefined;
    } | undefined>;
    private getDatabaseKeyPrefix;
    private keyForPayloadId;
    getAllRawDatabasePayloads(): Promise<any[]>;
    saveRawDatabasePayload(payload: any): Promise<void>;
    saveRawDatabasePayloads(payloads: any[]): Promise<void>;
    removeRawDatabasePayloadWithId(id: string): Promise<void>;
    removeAllRawDatabasePayloads(): Promise<void>;
    getKeychainValue(): Promise<any>;
    setKeychainValue(value: any): Promise<void>;
    clearKeychainValue(): Promise<void>;
    openUrl(url: string): void;
}
