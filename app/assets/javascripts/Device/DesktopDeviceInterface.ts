import { DeviceInterface, Environment } from '@standardnotes/snjs'
import { WebCommunicationReceiver } from './DesktopWebCommunication'
import { WebOrDesktopDeviceInterface } from './WebOrDesktopDeviceInterface'

export function isDesktopDevice(x: DeviceInterface): x is DesktopDeviceInterface {
  return x.environment === Environment.Desktop
}

export interface DesktopDeviceInterface
  extends WebOrDesktopDeviceInterface,
    WebCommunicationReceiver {
  environment: Environment.Desktop
}
