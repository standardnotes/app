import { DecryptedTransferPayload } from '@standardnotes/models'
import { DesktopWatchedDirectoriesChanges, DirectoryManagerInterface, FileBackupsDevice } from '@standardnotes/files'

export interface WebClientRequiresDesktopMethods extends FileBackupsDevice, DirectoryManagerInterface {
  syncComponents(payloads: unknown[]): void

  onSearch(text?: string): void

  get extensionsServerHost(): string

  askForMediaAccess(type: 'camera' | 'microphone'): Promise<boolean>
}

export interface DesktopClientRequiresWebMethods {
  updateAvailable(): void

  windowGainedFocus(): void

  windowLostFocus(): void

  consoleLog(message: string): void

  onComponentInstallationComplete(componentData: DecryptedTransferPayload, error: unknown): Promise<void>

  handleWatchedDirectoriesChanges(changes: DesktopWatchedDirectoriesChanges): Promise<void>

  handleHomeServerStarted(serverUrl: string): Promise<void>
}
