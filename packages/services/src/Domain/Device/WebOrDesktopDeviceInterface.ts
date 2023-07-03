import { ApplicationInterface } from './../Application/ApplicationInterface'
import { DeviceInterface } from './DeviceInterface'
import { RawKeychainValue } from '@standardnotes/models'

export interface WebOrDesktopDeviceInterface extends DeviceInterface {
  readonly appVersion: string

  getKeychainValue(): Promise<RawKeychainValue>

  setKeychainValue(value: RawKeychainValue): Promise<void>

  setApplication(application: ApplicationInterface): void
  removeApplication(application: ApplicationInterface): void
}
