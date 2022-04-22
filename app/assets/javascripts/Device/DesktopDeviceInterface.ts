import { DeviceInterface, Environment } from '@standardnotes/snjs'
import { WebOrDesktopDevice } from '@/Device/WebOrDesktopDevice'
import { WebCommunicationReceiver } from './DesktopWebCommunication'

export function isDesktopDevice(x: DeviceInterface): x is DesktopDeviceInterface {
  return x.environment === Environment.Desktop
}

export interface DesktopDeviceInterface extends WebOrDesktopDevice, WebCommunicationReceiver {
  environment: Environment.Desktop
}
