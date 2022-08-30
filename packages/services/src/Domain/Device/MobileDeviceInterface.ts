import { DeviceInterface } from './DeviceInterface'
import { Environment } from './Environments'
import { RawKeychainValue } from '@standardnotes/models'

export interface MobileDeviceInterface extends DeviceInterface {
  environment: Environment.Mobile

  getRawKeychainValue(): Promise<RawKeychainValue | undefined>
  getDeviceBiometricsAvailability(): Promise<boolean>
  setAndroidScreenshotPrivacy(enable: boolean): Promise<void>
  getMobileScreenshotPrivacyEnabled(): Promise<boolean | undefined>
}
