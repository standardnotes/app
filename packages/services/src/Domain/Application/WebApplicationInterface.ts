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
  handleMobileColorSchemeChangeEvent(): void
  handleMobileKeyboardWillChangeFrameEvent(frame: { height: number; contentHeight: number }): void
  handleMobileKeyboardDidChangeFrameEvent(frame: { height: number; contentHeight: number }): void
  isNativeMobileWeb(): boolean
  mobileDevice(): MobileDeviceInterface
  handleAndroidBackButtonPressed(): void
  addAndroidBackHandlerEventListener(listener: () => boolean): (() => void) | undefined
  setAndroidBackHandlerFallbackListener(listener: () => boolean): void
  generateUUID(): string
}
