import { FileBackupsDevice, HomeServerManagerInterface } from '@web/Application/Device/DesktopSnjsExports'
import { Component } from '../Main/Packages/PackageManagerInterface'

export interface CrossProcessBridge extends FileBackupsDevice, HomeServerManagerInterface {
  get extServerHost(): string
  get useNativeKeychain(): boolean
  get rendererPath(): string
  get isMacOS(): boolean
  get appVersion(): string
  get useSystemMenuBar(): boolean
  closeWindow(): void
  minimizeWindow(): void
  maximizeWindow(): void
  unmaximizeWindow(): void
  isWindowMaximized(): boolean
  getKeychainValue(): Promise<unknown>
  setKeychainValue: (value: unknown) => Promise<void>
  clearKeychainValue(): Promise<boolean>
  displayAppMenu(): void
  syncComponents(components: Component[]): void
  onSearch(text: string): void
  destroyAllData(): void
  askForMediaAccess(type: 'camera' | 'microphone'): Promise<boolean>
  setHomeServerConfiguration(configurationJSONString: string): Promise<void>
  setHomeServerDataLocation(location: string): Promise<void>
  getLastServerErrorMessage(): string | undefined
  activatePremiumFeatures(username: string): Promise<string | null>
  isServerRunning(): Promise<boolean>
  getServerLogs(): Promise<string[]>
}
