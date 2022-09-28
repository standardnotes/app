import { MobileDeviceInterface } from './../Device/MobileDeviceInterface'
import { DesktopManagerInterface } from '../Device/DesktopManagerInterface'
import { WebAppEvent } from '../Event/WebAppEvent'
import { ApplicationInterface } from './ApplicationInterface'

export interface WebApplicationInterface extends ApplicationInterface {
  notifyWebEvent(event: WebAppEvent, data?: unknown): void
  getDesktopService(): DesktopManagerInterface | undefined
  handleMobileEnteringBackgroundEvent(): Promise<void>
  handleMobileGainingFocusEvent(): Promise<void>
  handleMobileLosingFocusEvent(): Promise<void>
  handleMobileResumingFromBackgroundEvent(): Promise<void>
  isNativeMobileWeb(): boolean
  get mobileDevice(): MobileDeviceInterface
  handleAndroidBackButtonPressed(): void
  addAndroidBackHandlerEventListener(listener: () => boolean): (() => void) | undefined
}
