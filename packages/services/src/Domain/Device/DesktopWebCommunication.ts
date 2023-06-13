import { DecryptedTransferPayload } from '@standardnotes/models'
import { DesktopWatchedDirectoriesChanges, FileBackupsDevice } from '@standardnotes/files'

export interface WebClientRequiresDesktopMethods extends FileBackupsDevice {
  syncComponents(payloads: unknown[]): void

  onSearch(text?: string): void

  get extensionsServerHost(): string

  askForMediaAccess(type: 'camera' | 'microphone'): Promise<boolean>
}

export interface DesktopClientRequiresWebMethods {
  updateAvailable(): void

  windowGainedFocus(): void

  windowLostFocus(): void

  onComponentInstallationComplete(componentData: DecryptedTransferPayload, error: unknown): Promise<void>

  handleWatchedDirectoriesChanges(changes: DesktopWatchedDirectoriesChanges): Promise<void>

  handleHomeServerConfigurationChanged(configJSON: string): Promise<void>

  handleHomeServerStarted(serverUrl: string): Promise<void>
}
