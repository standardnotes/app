import { DeviceInterface, SNApplication, ApplicationIdentifier } from 'snjs';
import { Bridge } from './services/bridge';
export declare class WebDeviceInterface extends DeviceInterface {
    private bridge;
    private databases;
    constructor(timeout: any, bridge: Bridge);
    setApplication(application: SNApplication): void;
    private databaseForIdentifier;
    deinit(): void;
    getRawStorageValue(key: string): Promise<string | null>;
    getAllRawStorageKeyValues(): Promise<{
        key: string;
        value: any;
    }[]>;
    setRawStorageValue(key: string, value: any): Promise<void>;
    removeRawStorageValue(key: string): Promise<void>;
    removeAllRawStorageValues(): Promise<void>;
    openDatabase(identifier: ApplicationIdentifier): Promise<{
        isNewDatabase?: boolean | undefined;
    } | undefined>;
    getAllRawDatabasePayloads(identifier: ApplicationIdentifier): Promise<any[]>;
    saveRawDatabasePayload(payload: any, identifier: ApplicationIdentifier): Promise<void>;
    saveRawDatabasePayloads(payloads: any[], identifier: ApplicationIdentifier): Promise<void>;
    removeRawDatabasePayloadWithId(id: string, identifier: ApplicationIdentifier): Promise<void>;
    removeAllRawDatabasePayloads(identifier: ApplicationIdentifier): Promise<void>;
    getNamespacedKeychainValue(identifier: ApplicationIdentifier): Promise<any>;
    setNamespacedKeychainValue(value: any, identifier: ApplicationIdentifier): Promise<void>;
    clearNamespacedKeychainValue(identifier: ApplicationIdentifier): Promise<void>;
    getRawKeychainValue(): Promise<any>;
    clearRawKeychainValue(): Promise<void>;
    openUrl(url: string): void;
}
