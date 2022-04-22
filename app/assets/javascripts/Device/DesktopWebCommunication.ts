import { DecryptedTransferPayload } from '@standardnotes/snjs'

/** Receives communications emitted by Web Core. This would be the Desktop client. */
export interface WebCommunicationReceiver {
  localBackupsCount(): Promise<number>

  viewlocalBackups(): void

  deleteLocalBackups(): Promise<void>

  syncComponents(payloads: unknown[]): void

  onMajorDataChange(): void

  onInitialDataLoad(): void

  onSignOut(): void

  onSearch(text?: string): void

  downloadBackup(): void | Promise<void>

  get extensionsServerHost(): string
}

/** Receives communications emitted by the desktop client. This would be Web Core. */
export interface DesktopCommunicationReceiver {
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
