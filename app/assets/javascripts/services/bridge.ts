/**
 * This file will be imported by desktop, so we make sure imports are carrying
 * as little extra code as possible with them.
 */
import { Environment } from '@standardnotes/snjs';

/** Platform-specific (i-e Electron/browser) behavior is handled by a Bridge object. */
export interface Bridge {
  readonly appVersion: string;
  environment: Environment;

  getKeychainValue(): Promise<unknown>;
  setKeychainValue(value: any): Promise<void>;
  clearKeychainValue(): Promise<void>;

  extensionsServerHost?: string;
  syncComponents(payloads: unknown[]): void;
  onMajorDataChange(): void;
  onInitialDataLoad(): void;
  onSearch(text?: string): void;
  downloadBackup(): Promise<void>;
}
