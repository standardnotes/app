import {
  DirectoryManagerInterface,
  FileBackupsDevice,
  HomeServerManagerInterface,
} from '@web/Application/Device/DesktopSnjsExports'
import { Component } from '../Main/Packages/PackageManagerInterface'

export interface CrossProcessBridge extends FileBackupsDevice, DirectoryManagerInterface, HomeServerManagerInterface {
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
}
