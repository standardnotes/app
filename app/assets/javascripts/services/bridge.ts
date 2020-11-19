/**
 * This file will be imported by desktop, so we make sure imports are not
 * carrying too much code with them that's not tree-shakeable.
 */
import { Environment } from '@standardnotes/snjs';
export { Environment };

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
  downloadBackup(): void;
}
