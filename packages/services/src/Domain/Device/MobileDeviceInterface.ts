import { DeviceInterface } from './DeviceInterface'
import { Environment, RawKeychainValue } from '@standardnotes/models'

export interface MobileDeviceInterface extends DeviceInterface {
  environment: Environment.Mobile

  getRawKeychainValue(): Promise<RawKeychainValue | undefined>
  getDeviceBiometricsAvailability(): Promise<boolean>
  setAndroidScreenshotPrivacy(enable: boolean): void
  authenticateWithBiometrics(): Promise<boolean>
  hideMobileInterfaceFromScreenshots(): void
  stopHidingMobileInterfaceFromScreenshots(): void
  consoleLog(...args: any[]): void
  handleThemeSchemeChange(isDark: boolean): void
}
