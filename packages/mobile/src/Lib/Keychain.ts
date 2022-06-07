import { RawKeychainValue } from '@standardnotes/snjs'
import * as RCTKeychain from 'react-native-keychain'

export default class Keychain {
  static async setKeys(keys: object) {
    const iOSOptions = {
      accessible: RCTKeychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }
    return RCTKeychain.setGenericPassword('sn', JSON.stringify(keys), iOSOptions)
  }

  static async getKeys(): Promise<RawKeychainValue | undefined | null> {
    return RCTKeychain.getGenericPassword()
      .then(function (credentials) {
        if (!credentials || !credentials.password) {
          return null
        } else {
          const keys = JSON.parse(credentials.password)
          return keys
        }
      })
      .catch(function (error) {
        console.error("Keychain couldn't be accessed! Maybe no value set?", error)
        return undefined
      })
  }

  static async clearKeys() {
    return RCTKeychain.resetGenericPassword()
  }
}
