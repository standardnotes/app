/** Platform-specific (i-e Electron/browser) behavior is handled by a Bridge object. */
export interface Bridge {
    getKeychainValue(): Promise<unknown>;
    setKeychainValue(value: any): Promise<void>;
    clearKeychainValue(): Promise<void>;
}
export declare class BrowserBridge implements Bridge {
    getKeychainValue(): Promise<unknown>;
    setKeychainValue(value: any): Promise<void>;
    clearKeychainValue(): Promise<void>;
}
