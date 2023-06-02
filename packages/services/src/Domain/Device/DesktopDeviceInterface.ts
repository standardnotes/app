import { Environment } from '@standardnotes/models'

import { WebClientRequiresDesktopMethods } from './DesktopWebCommunication'
import { DeviceInterface } from './DeviceInterface'
import { WebOrDesktopDeviceInterface } from './WebOrDesktopDeviceInterface'

/* istanbul ignore file */

export function isDesktopDevice(x: DeviceInterface): x is DesktopDeviceInterface {
  return x.environment === Environment.Desktop
}

export interface DesktopDeviceInterface extends WebOrDesktopDeviceInterface, WebClientRequiresDesktopMethods {
  environment: Environment.Desktop
}
