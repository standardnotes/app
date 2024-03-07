import { ApiVersion } from '@standardnotes/api'
import { Environment, Platform, ApplicationIdentifier } from '@standardnotes/models'
import { AlertService, DeviceInterface } from '@standardnotes/services'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

export interface RequiredApplicationOptions {
  /**
   * The Environment that identifies your application.
   */
  environment: Environment
  /**
   * The Platform that identifies your application.
   */
  platform: Platform
  /**
   * The device interface that provides platform specific
   * utilities that are used to read/write raw values from/to the database or value storage.
   */
  deviceInterface: DeviceInterface
  /**
   * The platform-dependent implementation of SNPureCrypto to use.
   * Web uses SNWebCrypto, mobile uses SNReactNativeCrypto.
   */
  crypto: PureCryptoInterface
  /**
   * The platform-dependent implementation of alert service.
   */
  alertService: AlertService
  /**
   * A unique persistent identifier to namespace storage and other
   * persistent properties. For an ephemeral runtime identifier, use ephemeralIdentifier.
   */
  identifier: ApplicationIdentifier

  /**
   * Default host to use in ApiService.
   */
  defaultHost: string
  /**
   * Version of client application.
   */
  appVersion: string

  apiVersion: ApiVersion
}
