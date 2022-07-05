import { DecryptedTransferPayload } from '@standardnotes/models'
import { FileBackupsDevice } from './FileBackupsDevice'

export interface WebClientRequiresDesktopMethods extends FileBackupsDevice {
  localBackupsCount(): Promise<number>

  viewlocalBackups(): void

  deleteLocalBackups(): Promise<void>

  syncComponents(payloads: unknown[]): void

  onMajorDataChange(): void

  onInitialDataLoad(): void

  onSearch(text?: string): void

  downloadBackup(): void | Promise<void>

  get extensionsServerHost(): string
}

export interface DesktopClientRequiresWebMethods {
  updateAvailable(): void

  windowGainedFocus(): void

  windowLostFocus(): void

  onComponentInstallationComplete(componentData: DecryptedTransferPayload, error: unknown): Promise<void>

  requestBackupFile(): Promise<string | undefined>

  didBeginBackup(): void

  didFinishBackup(success: boolean): void
}
