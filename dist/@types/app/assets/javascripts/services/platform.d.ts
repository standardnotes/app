/** Platform-specific (i-e desktop/web) behavior is handled by a Platform object. */
export interface Platform {
    getKeychainValue(): Promise<unknown>;
    setKeychainValue(value: any): Promise<void>;
    clearKeychainValue(): Promise<void>;
}
export declare class WebPlatform implements Platform {
    getKeychainValue(): Promise<unknown>;
    setKeychainValue(value: any): Promise<void>;
    clearKeychainValue(): Promise<void>;
}
