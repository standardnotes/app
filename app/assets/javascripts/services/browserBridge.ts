import { Bridge } from './bridge';
import { Environment } from '@standardnotes/snjs';

const KEYCHAIN_STORAGE_KEY = 'keychain';

export class BrowserBridge implements Bridge {
  constructor(public appVersion: string) {}
  environment = Environment.Web;

  async getKeychainValue(): Promise<unknown> {
    const value = localStorage.getItem(KEYCHAIN_STORAGE_KEY);
    if (value) {
      return JSON.parse(value);
    }
  }

  async setKeychainValue(value: unknown): Promise<void> {
    localStorage.setItem(KEYCHAIN_STORAGE_KEY, JSON.stringify(value));
  }

  async clearKeychainValue(): Promise<void> {
    localStorage.removeItem(KEYCHAIN_STORAGE_KEY);
  }

  async localBackupsCount(): Promise<number> {
    /** Browsers cannot save backups, only let you download one */
    return 0;
  }

  /** No-ops */

  /* eslint-disable @typescript-eslint/no-empty-function */
  async deleteLocalBackups(): Promise<void> {}
  viewlocalBackups(): void {}
  syncComponents(): void {}
  onMajorDataChange(): void {}
  onInitialDataLoad(): void {}
  onSearch(): void {}
  downloadBackup(): void {}
  onSignOut(): void {}
}
