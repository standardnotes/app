import { MobileDeviceInterface } from './MobileDeviceInterface'
import { DeviceInterface } from './DeviceInterface'
import { Environment } from '@standardnotes/models'

/* istanbul ignore file */

export function isMobileDevice(x: DeviceInterface): x is MobileDeviceInterface {
  return x.environment === Environment.Mobile
}
