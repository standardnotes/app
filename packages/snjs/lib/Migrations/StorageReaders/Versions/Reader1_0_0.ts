import { isNullOrUndefined } from '@standardnotes/utils'
import { isEnvironmentMobile } from '@Lib/Application/Platforms'
import { PreviousSnjsVersion1_0_0 } from '../../../Version'
import { isMobileDevice, LegacyKeys1_0_0 } from '@standardnotes/services'
import { StorageReader } from '../Reader'

export class StorageReader1_0_0 extends StorageReader {
  static override version() {
    return PreviousSnjsVersion1_0_0
  }

  public async getAccountKeyParams() {
    return this.deviceInterface.getJsonParsedRawStorageValue(LegacyKeys1_0_0.AllAccountKeyParamsKey)
  }

  /**
   * In 1.0.0, web uses raw storage for unwrapped account key, and mobile uses
   * the keychain
   */
  public async hasNonWrappedAccountKeys() {
    if (isMobileDevice(this.deviceInterface)) {
      const value = await this.deviceInterface.getRawKeychainValue()
      return !isNullOrUndefined(value)
    } else {
      const value = await this.deviceInterface.getRawStorageValue('mk')
      return !isNullOrUndefined(value)
    }
  }

  public async hasPasscode() {
    if (isEnvironmentMobile(this.environment)) {
      const rawPasscodeParams = await this.deviceInterface.getJsonParsedRawStorageValue(
        LegacyKeys1_0_0.MobilePasscodeParamsKey,
      )
      return !isNullOrUndefined(rawPasscodeParams)
    } else {
      const encryptedStorage = await this.deviceInterface.getJsonParsedRawStorageValue(
        LegacyKeys1_0_0.WebEncryptedStorageKey,
      )
      return !isNullOrUndefined(encryptedStorage)
    }
  }

  /** Keychain was not used on desktop/web in 1.0.0 */
  public usesKeychain() {
    return isEnvironmentMobile(this.environment) ? true : false
  }
}
