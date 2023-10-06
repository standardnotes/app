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
          /**
           * Android 14 returns the bel character (/u0007) for some reason appended several times at the end of the string.
           * This value is oddly not present when the keys are stringified in setKeys above.
           */
          // eslint-disable-next-line no-control-regex
          const cleanedString = credentials.password.replace(/\x07/g, '')

          const keys = JSON.parse(cleanedString)

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
