/**
 * This file will be imported by desktop, so we make sure imports are carrying
 * as little extra code as possible with them.
 */
import { Environment, FeatureIdentifier } from '@standardnotes/snjs';

/** Platform-specific (i-e Electron/browser) behavior is handled by a Bridge object. */
export interface Bridge {
  readonly appVersion: string;
  environment: Environment;

  getKeychainValue(): Promise<unknown>;
  setKeychainValue(value: unknown): Promise<void>;
  clearKeychainValue(): Promise<void>;

  localBackupsCount(): Promise<number>;
  viewlocalBackups(): void;
  deleteLocalBackups(): Promise<void>;

  extensionsServerHost?: string;
  syncComponents(payloads: unknown[]): void;
  onMajorDataChange(): void;
  onInitialDataLoad(): void;
  onSignOut(): void;
  onSearch(text?: string): void;
  downloadBackup(): void | Promise<void>;
}
