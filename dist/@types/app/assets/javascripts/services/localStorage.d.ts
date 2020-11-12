export declare enum StorageKey {
    DisableErrorReporting = "DisableErrorReporting"
}
export declare const storage: {
    get(key: StorageKey): any;
    set(key: StorageKey, value: unknown): void;
    remove(key: StorageKey): void;
};
