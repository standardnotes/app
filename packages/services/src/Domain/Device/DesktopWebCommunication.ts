import { DecryptedTransferPayload } from '@standardnotes/models'
import { DesktopWatchedDirectoriesChanges, FileBackupsDevice } from '@standardnotes/files'

export interface WebClientRequiresDesktopMethods extends FileBackupsDevice {
  syncComponents(payloads: unknown[]): void

  onSearch(text?: string): void

  get extensionsServerHost(): string

  askForMediaAccess(type: 'camera' | 'microphone'): Promise<boolean>

  setHomeServerConfiguration(configurationJSONString: string): Promise<void>

  setHomeServerDataLocation(location: string): Promise<void>

  startServer(): Promise<void>

  stopServer(): Promise<void>

  isServerRunning(): Promise<boolean>

  activatePremiumFeatures(username: string): Promise<string | null>

  getServerLogs(): Promise<string[]>

  getLastServerErrorMessage(): string | undefined
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
