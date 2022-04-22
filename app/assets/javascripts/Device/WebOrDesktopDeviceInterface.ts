import { DeviceInterface, RawKeychainValue } from '@standardnotes/snjs'

export interface WebOrDesktopDeviceInterface extends DeviceInterface {
  readonly appVersion: string

  getKeychainValue(): Promise<RawKeychainValue>

  setKeychainValue(value: RawKeychainValue): Promise<void>
}
