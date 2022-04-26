import { DeviceInterface, Environment } from '@standardnotes/snjs'
import { WebClientRequiresDesktopMethods } from './DesktopWebCommunication'
import { WebOrDesktopDeviceInterface } from './WebOrDesktopDeviceInterface'

export function isDesktopDevice(x: DeviceInterface): x is DesktopDeviceInterface {
  return x.environment === Environment.Desktop
}

export interface DesktopDeviceInterface
  extends WebOrDesktopDeviceInterface,
    WebClientRequiresDesktopMethods {
  environment: Environment.Desktop
}
