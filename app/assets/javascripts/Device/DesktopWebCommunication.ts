import { DecryptedTransferPayload } from '@standardnotes/snjs'

export interface WebClientRequiresDesktopMethods {
  localBackupsCount(): Promise<number>

  viewlocalBackups(): void

  deleteLocalBackups(): Promise<void>

  syncComponents(payloads: unknown[]): void

  onMajorDataChange(): void

  onInitialDataLoad(): void

  /**
   * Destroys all sensitive storage data, such as localStorage, IndexedDB, and other log files.
   */
  destroyAllData(): void

  onSearch(text?: string): void

  downloadBackup(): void | Promise<void>

  get extensionsServerHost(): string
}

export interface DesktopClientRequiresWebMethods {
  updateAvailable(): void

  windowGainedFocus(): void

  windowLostFocus(): void

  onComponentInstallationComplete(
    componentData: DecryptedTransferPayload,
    error: unknown,
  ): Promise<void>

  requestBackupFile(): Promise<string | undefined>

  didBeginBackup(): void

  didFinishBackup(success: boolean): void
}
