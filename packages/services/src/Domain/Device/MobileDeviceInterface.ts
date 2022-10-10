import { DeviceInterface } from './DeviceInterface'
import { Environment, Platform, RawKeychainValue } from '@standardnotes/models'

export interface MobileDeviceInterface extends DeviceInterface {
  environment: Environment.Mobile
  platform: Platform.Ios | Platform.Android

  getRawKeychainValue(): Promise<RawKeychainValue | undefined>
  getDeviceBiometricsAvailability(): Promise<boolean>
  setAndroidScreenshotPrivacy(enable: boolean): void
  authenticateWithBiometrics(): Promise<boolean>
  hideMobileInterfaceFromScreenshots(): void
  stopHidingMobileInterfaceFromScreenshots(): void
  consoleLog(...args: any[]): void
  handleThemeSchemeChange(isDark: boolean, bgColor: string): void
  shareBase64AsFile(base64: string, filename: string): Promise<void>
  downloadBase64AsFile(base64: string, filename: string, saveInTempLocation?: boolean): Promise<string | undefined>
  previewFile(base64: string, filename: string): Promise<boolean>
  confirmAndExit(): void
  getWindowDimensions(): {
    width: number
    height: number
  }
}
