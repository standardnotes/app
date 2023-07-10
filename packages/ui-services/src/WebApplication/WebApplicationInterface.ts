import {
  ApplicationInterface,
  DesktopManagerInterface,
  MobileDeviceInterface,
  WebAppEvent,
} from '@standardnotes/services'

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
  handleReceivedFilesEvent(files: { name: string; mimeType: string; data: string }[]): void
  isNativeMobileWeb(): boolean
  mobileDevice(): MobileDeviceInterface
  handleAndroidBackButtonPressed(): void
  addAndroidBackHandlerEventListener(listener: () => boolean): (() => void) | undefined
  setAndroidBackHandlerFallbackListener(listener: () => boolean): void
  generateUUID(): string
}
