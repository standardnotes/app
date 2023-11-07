import { Environment, Platform, RawKeychainValue } from '@standardnotes/models'

import { AppleIAPProductId } from './../Subscription/AppleIAPProductId'
import { DeviceInterface } from './DeviceInterface'
import { AppleIAPReceipt } from '../Subscription/AppleIAPReceipt'
import { ApplicationEvent } from '../Event/ApplicationEvent'

import type { Notification } from '../../../../mobile/node_modules/@notifee/react-native/dist/index'

export interface MobileDeviceInterface extends DeviceInterface {
  environment: Environment.Mobile
  platform: Platform.Ios | Platform.Android

  getRawKeychainValue(): Promise<RawKeychainValue | undefined>
  getDeviceBiometricsAvailability(): Promise<boolean>
  setAndroidScreenshotPrivacy(enable: boolean): void
  authenticateWithBiometrics(): Promise<boolean>
  hideMobileInterfaceFromScreenshots(): void
  stopHidingMobileInterfaceFromScreenshots(): void

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  consoleLog(...args: any[]): void

  handleThemeSchemeChange(isDark: boolean, bgColor: string): void
  shareBase64AsFile(base64: string, filename: string): Promise<void>
  downloadBase64AsFile(base64: string, filename: string, saveInTempLocation?: boolean): Promise<string | undefined>
  previewFile(base64: string, filename: string): Promise<boolean>
  exitApp(confirm?: boolean): void

  registerComponentUrl(componentUuid: string, componentUrl: string): void
  deregisterComponentUrl(componentUuid: string): void
  isUrlRegisteredComponentUrl(url: string): boolean

  getAppState(): Promise<'active' | 'background' | 'inactive' | 'unknown' | 'extension'>
  getColorScheme(): Promise<'light' | 'dark' | null | undefined>
  purchaseSubscriptionIAP(plan: AppleIAPProductId): Promise<AppleIAPReceipt | undefined>
  authenticateWithU2F(authenticationOptionsJSONString: string): Promise<Record<string, unknown> | null>
  notifyApplicationEvent(event: ApplicationEvent): void

  canDisplayNotifications(): Promise<boolean>
  displayNotification(options: Notification): Promise<string>
  cancelNotification(notificationId: string): Promise<void>
}
