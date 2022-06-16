import SNReactNative from '@standardnotes/react-native-utils'
import { ApplicationService, ButtonType, isNullOrUndefined, StorageValueModes } from '@standardnotes/snjs'
import { MobileDeviceInterface } from './Interface'

const FIRST_RUN_KEY = 'first_run'

export class InstallationService extends ApplicationService {
  override async onAppStart() {
    if (await this.needsWipe()) {
      await this.wipeData()
    } else {
      void this.markApplicationAsRan()
    }
  }

  async markApplicationAsRan() {
    return this.application?.setValue(FIRST_RUN_KEY, false, StorageValueModes.Nonwrapped)
  }

  /**
   * Needs wipe if has keys but no data. However, since "no data" can be incorrectly reported by underlying
   * AsyncStorage failures, we want to confirm with the user before deleting anything.
   */
  async needsWipe() {
    const hasNormalKeys = this.application?.hasAccount() || this.application?.hasPasscode()
    const deviceInterface = this.application?.deviceInterface as MobileDeviceInterface
    const keychainKey = await deviceInterface?.getRawKeychainValue()
    const hasKeychainValue = !(
      isNullOrUndefined(keychainKey) ||
      (typeof keychainKey === 'object' && Object.keys(keychainKey).length === 0)
    )

    const firstRunKey = await this.application?.getValue(FIRST_RUN_KEY, StorageValueModes.Nonwrapped)
    let firstRunKeyMissing = isNullOrUndefined(firstRunKey)
    /*
     * Because of migration failure first run key might not be in non wrapped storage
     */
    if (firstRunKeyMissing) {
      const fallbackFirstRunValue = await this.application?.deviceInterface?.getRawStorageValue(FIRST_RUN_KEY)
      firstRunKeyMissing = isNullOrUndefined(fallbackFirstRunValue)
    }
    return !hasNormalKeys && hasKeychainValue && firstRunKeyMissing
  }

  /**
   * On iOS, keychain data is persisted between installs/uninstalls. (https://stackoverflow.com/questions/4747404/delete-keychain-items-when-an-app-is-uninstalled)
   * This prevents the user from deleting the app and reinstalling if they forgot their local passocde
   * or if fingerprint scanning isn't working. By deleting all data on first run, we allow the user to reset app
   * state after uninstall.
   */
  async wipeData() {
    const confirmed = await this.application?.alertService?.confirm(
      "We've detected a previous installation of Standard Notes based on your keychain data. You must wipe all data from previous installation to continue.\n\nIf you're seeing this message in error, it might mean we're having issues loading your local database. Please restart the app and try again.",
      'Previous Installation',
      'Delete Local Data',
      ButtonType.Danger,
      'Quit App',
    )

    if (confirmed) {
      await this.application?.deviceInterface?.removeAllRawStorageValues()
      await this.application?.deviceInterface?.removeAllRawDatabasePayloads(this.application?.identifier)
      await this.application?.deviceInterface?.clearRawKeychainValue()
    } else {
      SNReactNative.exitApp()
    }
  }
}
